'use strict';

var http = require('http');
var express = require('express');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var ShareDB = require('sharedb');
var ShareDBMongo = require('sharedb-mongo');
var ShareDBMongo = require('sharedb-mongo');
var ShareDBRedisPubSub = require('sharedb-redis-pubsub')
var ShareDBLogger = require('sharedb-logger')
var richText = require('rich-text');

// Set rich text as OT-type
ShareDB.types.register(richText.type);

// Setup mongo database
var db = ShareDBMongo(process.env.MONGO_URL, {safe: true});

// Setup pubsub using Redis
var pubsub = ShareDBRedisPubSub(process.env.REDIS_URL)

// Setup ShareDB backend
var backend = new ShareDB({db: db, pubsub: pubsub});

// Setup logger
var logger = new ShareDBLogger(backend);

// Setup in-memory database
// var backend = new ShareDB();

// Start
createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback) {
  var connection = backend.connect();
  var doc = connection.get('examples', 'richtext');
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create([{insert: 'Hi!'}], 'rich-text', callback);
      return;
    }
    callback();
  });
}

function startServer() {
  // Create a web server that listens to WebSocket connections
  var app = express();
  var server = http.createServer(app);

  // Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({server: server});
  wss.on('connection', function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });

  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
