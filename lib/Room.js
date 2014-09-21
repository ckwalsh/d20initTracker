var v = require('validator');
var Character = require('./Character');

function Room(key, data) {
  this.key = key;
  this.title = 'Title here';
  this.password = null;
  this.currentChar = null;
  this.characters = {};
  this.charIdx = 0;

  if (typeof data === 'object') {
    for (var k in data) {
      this.set(k, data[k]);
    }
  }
};

Room.prototype.rollInit = function () {
  for (var k in this.characters) {
    if (this.characters[k].involved) {
      this.characters[k].rollInit();
    }
  }

  this.currentChar = null;
}

Room.prototype.advanceInit = function () {
}

Room.prototype.set = function (field, val) {
  if (typeof field === 'object' && val === undefined) {
    for (var k in field) {
      this.set(k, field[k]);
    }
    return true;
  }

  switch (field) {
    case 'title':
      val = v.stripLow(val.toString(val));
      if (!v.isLength(val, 0, 20)) {
        return false;
      }
      this.title = val;
      break;
    case 'password':
      val = v.stripLow(v.trim(val));
      if (!v.isLength(val, 0, 20)) {
        return false;
      }
      this.password = val;
      break;
    case 'currentChar':
      val = v.toInteger(val);
      this.currentChar= val;
      break;
    default:
      return false;
  }

  return true;
};

Room.prototype.checkPassword = function (password) {
  if (this.password === null) {
    if (!this.set('password', password)) {
      return false;
    }
  }
  password = v.stripLow(v.trim(password));
  return this.password === password;
}

Room.prototype.charCreate = function() {
  var key = this.charIdx++;
  this.characters[key] = new Character(key);
  return this.characters[key];
};

Room.prototype.charGet = function(key) {
  return this.characters[key];
};

Room.prototype.charDelete = function(key) {
  if (this.characters[key] === undefined) {
    return false;
  }

  delete this.characters[key];
  return true;
};

Room.prototype.gmData = function() {
  return {
    key: this.key,
    title: this.title,
    password: this.password,
    currentChar: this.currentChar,
  };
};

Room.prototype.playerData = function() {
  var c = this.currentChar === null ? null : this.charGet(this.currentChar);
  return {
    key: this.key,
    title: this.title,
    currentChar: this.getPlayerVisibleInit(),
  };
};

Room.prototype.gmCharacterData = function() {
  var result = {};
  for (var k in this.characters) {
    result[k] = this.characters[k].gmData();
  }

  return result;
};

Room.prototype.sortedCharacterData = function() {
  var result = [];
  for (var k in this.characters) {
    result.push(this.characters[k]);
  }

  result.sort(function(a, b) {
    return a.playerCmp(b);
  });
  
  for (var i = 0; i < result.length; i++) {
    if (result[i].key === this.currentChar) {
      result = result.slice(i).concat(result.slice(0, i));
      break;
    }
  }

  return result;
}

Room.prototype.playerCharacterData = function() {
  var data = null;
  var result = this.sortedCharacterData();

  result = result.filter(function (c) {
    return c.involved && c.showChar;
  });

  return result.map(function (c) {
    return c.playerData();
  });

  return result;
};

Room.prototype.getPlayerVisibleInit = function() {
  var firstChar = null;
  var lastChar = null;
  var chars = this.sortedCharacterData();
  for (var i = 0; i < chars.length; i++) {
    if (chars[i].involved && chars[i].showChar) {
      lastChar = chars[i].key;
      if (!firstChar) {
        firstChar = chars[i].key;
      }
    }
    if (chars[i].key == this.currentChar) {
      return lastChar;
    }
  }

  return firstChar;
}

module.exports = Room;
