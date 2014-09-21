var v = require('validator');

function Character(key, data) {
  this.key = key;
  this.name = '';
  this.displayName = '';
  this.type = 'ENEMY';
  this.initRoll = 0;
  this.initBonus = 0;
  this.initRand = 0;
  this.hpDamageStr = '';
  this.hpDamage = 0;
  this.hpMax = 0;
  this.tags = '';
  this.involved = false;
  this.showChar = false;
  this.showInit = false;
  this.showDamage = false;
  this.showHP = false;

  if (typeof data == 'object') {
    for (var k in data) {
      this.set(k, data[k]);
    }
  }
}

Character.prototype.set = function (field, val) {
  if (typeof field == 'object' && val == undefined) {
    for (var k in field) {
      this.set(k, field[k]);
    }
    return true;
  }

  switch (field) {
    case 'name':
      val = v.stripLow(v.toString(val));
      if (!v.isLength(val, 0, 20)) {
        return false;
      }
      this.name = val;
      break;
    case 'displayName':
      val = v.stripLow(v.toString(val));
      if (!v.isLength(val, 0, 20)) {
        return false;
      }
      this.displayName = val;
      break;
    case 'type':
      switch (val) {
        case 'ENEMY':
        case 'NPC':
        case 'PC':
          this.type = val;
        default:
          return false;
      }
      break;
    case 'initRoll':
    case 'initBonus':
    case 'initRand':
      val = v.toInt(val);
      if (val == null || isNaN(val)) {
        val = 0;
      }
      this[field] = val;
      break;
    case 'hpDamageStr':
      val = v.trim(val);
      this.hpDamageStr = val;
      var parts = val.split(',');
      var dmg = 0;
      var dmgPart = 0;
      for (var i = 0; i < parts.length; i++) {
        dmgPart = v.toInt(parts[i]);
        if (dmgPart != null && !isNaN(dmgPart)) {
          dmg += dmgPart;
        }
      }
      this.hpDamage = dmg;
      break;
    case 'hpDamage':
    case 'hpMax':
      val = v.toInt(val);
      if (val == null || isNaN(val)) {
        return false;
      }
      this[field] = val;
      break;
    case 'tags':
      this.tags = v.trim(val);
      break;
    case 'involved':
    case 'showChar':
    case 'showInit':
    case 'showDamage':
    case 'showHP':
      this[field] = v.toBoolean(val);
      break;
    default:
      return false;
  }

  return true;
}

Character.prototype.rollInit = function() {
  this.initRoll = Math.ceil(Math.random() * 20);
  this.initRand = Math.floor(Math.random() * 16777216);
}

Character.prototype.playerCmp = function(other) {
  if (!(other instanceof Character)) {
    throw 'Expected to compare against Character';
  }

  if (!this.showInit && !other.showInit) {
    if (other.displayName == this.displayName) {
      return 0;
    } else if (other.displayName < this.displayName) {
      return 1;
    } else {
      return -1;
    }
  } else if (!this.showInit) {
    return 1;
  } else if (!other.showInit) {
    return -1;
  }

  var ot = other.initRoll + other.initBonus;
  var tt = this.initRoll + this.initBonus;
  if (ot !== tt) {
    return ot - tt;
  }

  if (other.initBonus !== this.initBonus) {
    return other.initBonus - this.initBonus;
  }

  return other.initRand - this.initRand;
}

Character.prototype.gmData = function() {
  return {
    key: this.key,
    name: this.name,
    displayName: this.displayName,
    type: this.type,
    initRoll: this.initRoll,
    initBonus: this.initBonus,
    initRand: this.initRand,
    hpDamageStr: this.hpDamageStr,
    hpDamage: this.hpDamage,
    hpMax: this.hpMax,
    tags: this.tags,
    involved: this.involved,
    showChar: this.showChar,
    showInit: this.showInit,
    showDamage: this.showDamage,
    showHP: this.showHP,
  };
};

Character.prototype.playerData = function() {
  if (!this.showChar) {
    return null;
  }

  var result = {
    key: this.key,
    name: this.displayName,
    type: this.type,
  };

  var newTags = {};
  var arrVal = '';
  var tagsArr = this.tags.split(',');
  for (var i = 0; i < tagsArr.length; i++) {
    arrVal = v.trim(tagsArr[i]);
    if (arrVal != '' && v.isAlpha(arrVal)) {
      newTags[arrVal] = 1;
    }
  }
  var healthTag = 'healthy';
  if (this.hpDamage >= this.hpMax / 2) {
    healthTag = 'bloodied';
  }
  if (this.hpDamage >= this.hpMax) {
    healthTag = 'unconcious';
  }
  newTags[healthTag] = 1;

  result.tags = newTags;

  if (this.showInit) {
    result.init = this.initRoll+this.initBonus;
  }

  if (this.showDamage) {
    result.hpDamageStr = this.hpDamageStr;
    result.hpDamage = this.hpDamage;

    if (this.showHP) {
      result.hpCurrent = this.hpMax - this.hpDamage;
    }
  }

  return result;
};

module.exports = Character;
