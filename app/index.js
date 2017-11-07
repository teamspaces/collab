'use strict';

var config = require('./config/main');
var app = require('express')();

var url = require('url');
var jwt = require('jsonwebtoken');

// Add _ping endpoint
app.get('/_ping', function(req, res){
  res.status(200)
     .send('pong');
});

var httpServer = require('http').Server(app);

httpServer.listen(config.http.port);
console.log('Your server is running on port ' + config.http.port + '.');

var ShareDBRedisPubSub = require('sharedb-redis-pubsub');
var WebSocketJSONStream = require('websocket-json-stream');
var RichText = require('rich-text');

var ShareDB = require('sharedb');
var RichText = require('rich-text');
ShareDB.types.register(RichText.type);

var shareDBMongo = require('sharedb-mongo')(config.mongodb_url, { safe: true });
var shareDBPubSub = require('sharedb-redis-pubsub')(config.redis_url);
var shareDB = new ShareDB({db: shareDBMongo, pubsub: shareDBPubSub});

shareDB.use(require('sharedb-logger'));

shareDB.use('doc', verifyAccess);
shareDB.use('apply', verifyAccess);
shareDB.use('commit', verifyAccess);

require('sharedb-access')(shareDB);
shareDB.allowRead(config.collection, function(){ return true; });
shareDB.allowUpdate(config.collection, function(){ return true; });

var wsServer = require('ws').Server({ server: httpServer });
wsServer.on('connection', function(ws, req){
    "Client connected."
    addStreamToShareDB(ws);
});
wsServer.on('close', function(ws, req){
    console.log('Client disconnected.');
});

function addStreamToShareDB(ws) {
  var stream = new WebSocketJSONStream(ws);
  shareDB.listen(stream);
}

function verifyAccess(request, callback) {
  var query = url.parse(request.agent.stream.ws.upgradeReq.url, true).query;
  var collection = request.collection;
  var documentId = request.id;

  var payload = decodeToken(query.token);
  if(!payload) {
    return callback({ code: 403,
                   message: 'invalid or expired token' });
  }

  if(collection !== payload.collection) {
    return callback({ code: 403,
                   message: 'not authorized to access this collection' });
  }

  if(documentId !== payload.document_id) {
    return callback({ code: 403,
                   message: 'not authorized to access this document' });
  }

  callback();
}

function decodeToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch(error) {
    if(error instanceof jwt.TokenExpiredError) {
      return;
    } else {
      throw error;
    }

    return;
  }
}

// TODO: Move this into it's own package.
// My docker containers don't respond to  ctrl+c and this fixes it.
process.on('SIGINT', function() {
  setTimeout(function() {
    process.exit(1);
  }, 200);
});
