var v = require('validator');
var Room = require('./Room');

function RoomManager() {
  this.rooms = {};
}

RoomManager.prototype.validateKey = function (key) {
  key = v.toString(key);
  if (key === '') {
    return null;
  }
  if (!v.isAlphanumeric(key)) {
    return null;
  }
  return key;
}

RoomManager.prototype.get = function (key) {
  key = this.validateKey(key);
  return this.rooms[key];
}

RoomManager.prototype.create = function (key) {
  key = this.validateKey(key);
  if (!key || this.rooms[key] !== undefined) {
    return null;
  }

  this.rooms[key] = new Room(key);

  return this.rooms[key];
}

RoomManager.prototype.getOrCreate = function (key) {
  var room = this.get(key);
  if (!room) {
    room = this.create(key);
  }

  return room;
}

module.exports = RoomManager;
