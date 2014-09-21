var SocketHandler = require('./SocketHandler');

function SocketServerHandler(io, rm) {
  this.io = io;
  this.rm = rm;
  io.on('connection', this.onConnect.bind(this));
}

SocketServerHandler.prototype.onConnect = function (socket) {
  var socket = new SocketHandler(socket, this.io, this.rm);
}

module.exports = SocketServerHandler;
