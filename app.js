var express = require('express');
var http = require('http');
var socketIO = require('socket.io');
var RoomManager = require('./lib/RoomManager');
var SocketServerHandler = require('./lib/SocketServerHandler');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('view engine', 'ejs');
app.get('/r/:roomName/', function(req, res) {
  res.render('room', { roomName: req.params.roomName })
});
app.get('/gm/:roomName/', function(req, res) {
  res.render('gm', { roomName: req.params.roomName })
});
app.use(express.static('public'));

var rm = new RoomManager();
var ssh = new SocketServerHandler(io, rm);

server.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
