function SocketHandler(socket, io, rm) {
  this.socket = socket;
  this.io = io;
  this.rm = rm;
  this.room = null;
  this.gm = false;

  socket.on('disconnect', this.onDisconnect.bind(this));
  socket.on('join', this.onJoin.bind(this));
  socket.on('auth', this.onAuth.bind(this));
  socket.on('mutateRoom', this.onMutateRoom.bind(this));
  socket.on('addCharacter', this.onAddChar.bind(this));
  socket.on('mutateCharacter', this.onMutateChar.bind(this));
  socket.on('deleteCharacter', this.onDeleteChar.bind(this));
  socket.on('rollInit', this.onRollInit.bind(this));
}

SocketHandler.prototype.onDisconnect = function (data) {
}

SocketHandler.prototype.onJoin = function (data) {
  var oldRoom = this.room;
  var newRoom = this.rm.getOrCreate(data.room);

  if (newRoom) {
    this.room = null;
    this.gm = false;
    var cb = function () {
      this.socket.join(newRoom.key+'_p', function (err) {
        if (!err) {
          this.room = newRoom;
          this.pushAllDataToSelf();
        }
      }.bind(this));
    }.bind(this);
    if (oldRoom !== null) {
      if (this.gm) {
        cb = function() {
          this.socket.leave(oldRoom.key+'_g', function (err) {
            if (!err) {
              cb();
            }
          }.bind(this));
        }.bind(this);
      }
      cb = function() {
        this.socket.leave(oldRoom.key+'_p', function (err) {
          if (!err) {
            cb();
          }
        }.bind(this));
      }.bind(this);
    }

    cb();
  }
}

SocketHandler.prototype.onAuth = function (data) {
  if (this.room === null) {
    return;
  }

  if (this.room.checkPassword(data.password)) {
    this.socket.join(this.room.key+'_g', function(err) {
      if (!err) {
        this.gm = true;
        this.pushAllGMDataToSelf();
      }
    }.bind(this));
  }
}

SocketHandler.prototype.onMutateRoom = function (data) {
  if (!this.gm) {
    return;
  }

  this.room.set(data);
  this.pushRoomData();
}

SocketHandler.prototype.onAddChar = function (data) {
  if (!this.gm) {
    return;
  }

  var character = this.room.charCreate();
  if (!character) {
    return;
  }

  this.pushCharacterCreate(character);
}

SocketHandler.prototype.onMutateChar = function (data) {
  if (!this.gm) {
    return;
  }

  var character = this.room.charGet(data.character);
  if (!character) {
    return;
  }

  if (character.set(data.data)) {
    this.pushCharacterUpdate(character);
  }
}

SocketHandler.prototype.onDeleteChar = function (data) {
  if (!this.gm) {
    return;
  }

  var character = this.room.charGet(data.key);
  var success = this.room.charDelete(data.key);
  if (!success) {
    return;
  }

  this.pushCharacterDelete(character);
}

SocketHandler.prototype.onRollInit = function () {
  if (!this.gm) {
    return;
  }
  
  this.room.rollInit();
  
  this.pushRoomData();
  this.pushCharData();
}

SocketHandler.prototype.push = function(ev, data) {
  if (this.room) {
    this.pushImpl(this.io.to(this.room.key+'_p'), ev, data);
  }
}

SocketHandler.prototype.pushGM = function(ev, data) {
  if (this.room) {
    this.pushImpl(this.io.to(this.room.key+'_g'), ev, data);
  }
}

SocketHandler.prototype.pushSelf = function(ev, data) {
  this.pushImpl(this.socket, ev, data);
}

SocketHandler.prototype.pushImpl = function(socket, ev, data) {
  socket.emit(ev, data);
}

SocketHandler.prototype.pushAllDataToSelf = function () {
  if (this.room) {
    this.pushSelf('updateRoom', this.room.playerData());
    this.pushSelf('setCharacters', this.room.playerCharacterData());
  }
}

SocketHandler.prototype.pushAllGMDataToSelf = function () {
  if (this.room) {
    this.pushSelf('gmUpdateRoom', this.room.gmData());
    this.pushSelf('gmSetCharacters', this.room.gmCharacterData());
  }
}

SocketHandler.prototype.pushRoomData = function () {
  if (this.room) {
    this.pushGM('gmUpdateRoom', this.room.gmData());
    this.push('updateRoom', this.room.playerData());
  }
}

SocketHandler.prototype.pushCharData = function () {
  if (this.room) {
    this.pushGM('gmSetCharacters', this.room.gmCharacterData());
    this.push('setCharacters', this.room.playerCharacterData());
  }
}

SocketHandler.prototype.pushCharacterCreate = function (character) {
  this.pushGM('gmAddCharacter', character.gmData());
  if (character.showChar) {
    this.push('setCharacters', this.room.playerCharacterData());
  }
}
SocketHandler.prototype.pushCharacterSet = function (character) {
  this.pushGM('gmSetCharacters', this.room.gmCharacterData());
  this.push('setCharacters', this.room.playerCharacterData());
  if (character.showChar) {
  }
}

SocketHandler.prototype.pushCharacterUpdate = function (character) {
  this.pushGM('gmUpdateCharacter', character.gmData());
  if (character.showChar) {
    this.push('setCharacters', this.room.playerCharacterData());
  }
}

SocketHandler.prototype.pushCharacterDelete = function (character) {
  this.pushGM('gmDeleteCharacter', character.key);
  if (character.showChar) {
    this.push('setCharacters', this.room.playerCharacterData());
  }
}

module.exports = SocketHandler;
