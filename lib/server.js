'use strict';

var http = require('http');
var express = require('express');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var ShareDB = require('sharedb');
var ShareDBMongo = require('sharedb-mongo');
var ShareDBRedisPubSub = require('sharedb-redis-pubsub')
var richText = require('rich-text');

// Set rich text as OT-type
ShareDB.types.register(richText.type);

// Setup mongo database
var db = ShareDBMongo(process.env.MONGO_URL, {safe: true});
var collection_name = 'collab_pages';

// Setup redis pubsub
var pubsub = ShareDBRedisPubSub(process.env.REDIS_URL)

// Setup ShareDB backend
var backend = new ShareDB({db: db, pubsub: pubsub});

// Add logging
require('sharedb-logger')(backend)

// Add access control
require('sharedb-access')(backend)

// Setup document access policies
backend.allowRead(collection_name, function(docId, doc, session){
  return true;
});

backend.allowUpdate(collection_name, function(docId, doc, session){
  return true;
});

function startServer() {
  /*
    Look at using express:
    - express
    - express-jwt (verify access to docId)
    - express-ws (for websocket routes)

    app.ws('/editor', function(ws, req) {
      var stream = new WebSocketJSONStream(ws);
      backend.listen(stream);
    });

    Notes:
    - Might also want to use `sharedb-agent-req` to pass on client name from jwt.
    - We probably want to re-authorize a user every now and then, close connection?
  */

  // Setup http server
  var server = http.createServer();

  // Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({server: server});
  wss.on('connection', function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });

  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
startServer();