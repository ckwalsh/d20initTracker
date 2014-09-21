var express = require('express');
var http = require('http');
var socketIO = require('socket.io');
var RoomManager = require('./lib/RoomManager');
var SocketServerHandler = require('./lib/SocketServerHandler');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.use(express.static('public'));

var rm = new RoomManager();
var ssh = new SocketServerHandler(io, rm);

server.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
