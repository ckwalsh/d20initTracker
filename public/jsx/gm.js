/** @jsx React.DOM */
var InitGMPage = React.createClass({displayName: 'InitGMPage',
  propTypes: {
    roomName: React.PropTypes.string.isRequired,
    socket: React.PropTypes.object.isRequired,
  },
  getInitialState: function() {
    return {
      room: {},
      characters: {},
    };
  },
  room: {},
  characters: {},
  componentDidMount: function() {
    this.props.socket.emit('join', {room: this.props.roomName});
    this.props.socket.on('gmUpdateRoom', function (data) {
      var setState = this.room === {};
      for (var k in data) {
        setState = setState || (data[k] !== this.room[k]);
        this.room[k] = data[k];
      }
      if (setState) {
        this.setState({room: this.room});
      }
    }.bind(this));
    this.props.socket.on('gmSetCharacters', function (data) {
      console.log('gmSetCharacters');
      console.log(data);
      this.characters = data;
      this.setState({characters: this.characters});
    }.bind(this));
    this.props.socket.on('gmAddCharacter', function(data) {
      console.log('gmAddCharacter');
      console.log(data);
      this.characters[data.key] = data;
      this.setState({characters: this.characters});
    }.bind(this));
    this.props.socket.on('gmUpdateCharacter', function(data) {
      console.log('gmUpdateCharacter');
      console.log(data);
      this.characters[data.key] = data;
      this.setState({characters: this.characters});
    }.bind(this));
    this.props.socket.on('gmDeleteCharacter', function(charKey) {
      console.log('gmDeleteCharacter');
      console.log(charKey);
      delete this.characters[charKey];
      this.setState({characters: this.characters});
    }.bind(this));
  },
  render: function() {
    if (!this.state.room.key) {
      return <div id="content">
        <InitGMLogin socket={this.props.socket} />
      </div>;
    } else {
      return <div id="content">
        <InitGMCampaignInfo socket={this.props.socket} room={this.state.room} />
        <InitGMCharacterInfo socket={this.props.socket} room={this.state.room} characters={this.state.characters} />
      </div>;
    }
  }
});

var InitGMLogin = React.createClass({displayName: 'InitGMLogin',
  propTypes: {
    socket: React.PropTypes.object.isRequired
  },
  onSubmit: function(e) {
    e.preventDefault();
    var password = this.refs.password.getDOMNode().value;
    if (!password) {
      alert('Need to enter password');
      return;
    }
    var data = {
      password: password,
    };
    this.props.socket.emit('auth', data);
  },
  render: function() {
    return <div id="gmLogin">
      <form onSubmit={this.onSubmit}>
        <label>Password <input type="text" ref="password" /></label>
        <input type="submit" value="Login" />
      </form>
    </div>;
  }
});

var InitGMCampaignInfo = React.createClass({displayName: 'InitGMCampaignInfo',
  propTypes: {
    socket: React.PropTypes.object.isRequired,
  },
  onTitleChange: function () {
    var data = {
      title: this.refs.title.getDOMNode().value
    };
    this.props.socket.emit('mutateRoom', data);
  },
  onPasswordChange: function () {
    var data = {
      password: this.refs.password.getDOMNode().value
    };
    this.props.socket.emit('mutateRoom', data);
  },
  render: function() {
    return <div id="gmCampaignInfo">
      <label>Title: <input type="text" ref="title" value={this.props.room.title} onChange={this.onTitleChange} /></label>
      <label>Password: <input type="text" ref="password" value={this.props.room.password} onChange={this.onPasswordChange} /></label>
    </div>;
  }
});

var InitGMCharacterInfo = React.createClass({displayName: 'InitGMCharacterInfo',
  propTypes: {
    socket: React.PropTypes.object.isRequired,
  },
  onAddCharacter: function(e) {
    this.props.socket.emit('addCharacter');
  },
  onRollInit: function(e) {
    this.props.socket.emit('rollInit');
  },
  render: function() {
    var rows = [];
    for (var key in this.props.characters) {
      rows.push(
        <InitGMCharacterRow socket={this.props.socket} data={this.props.characters[key]} key={key} />
      );
    }
    return <div id="gmCharacterInfo">
      <button onClick={this.onAddCharacter}>Add Character</button>
      <button onClick={this.onRollInit}>Roll Init</button>
      <table>
        <tr>
          <th>Name</th>
          <th>Display</th>
          <th>Type</th>
          <th>I Roll</th>
          <th>I Bonus</th>
          <th>I Rand</th>
          <th>HP Dmg Str</th>
          <th>HP Dmg</th>
          <th>HP Max</th>
          <th>Tags</th>
          <th>Involved?</th>
          <th>Show Char</th>
          <th>Show Init</th>
          <th>Show Damage</th>
          <th>Show HP</th>
          <th>Actions</th>
        </tr>
        {rows}
      </table>
    </div>;
  }
});

var InitGMCharacterRow = React.createClass({displayName: 'InitGMCharacterRow',
  propTypes: {
    socket: React.PropTypes.object.isRequired,
    data: React.PropTypes.shape({
      name: React.PropTypes.string,
      displayName: React.PropTypes.string,
      type: React.PropTypes.oneOf(['PC', 'NPC', 'ENEMY']),
      initRoll: React.PropTypes.number,
      initBonus: React.PropTypes.number,
      initRand: React.PropTypes.number,
      hpDamageStr: React.PropTypes.string,
      hpDamage: React.PropTypes.number,
      hpMax: React.PropTypes.number,
      tags: React.PropTypes.string,
      involved: React.PropTypes.bool,
      showChar: React.PropTypes.bool,
      showInit: React.PropTypes.bool,
      showDamage: React.PropTypes.bool,
      showHP: React.PropTypes.bool
    }).isRequired,
    key: React.PropTypes.string.isRequired
  },
  onChange: function(key, value) {
    var data = {
      character: this.props.key,
      data: {},
    };
    data.data[key] = value;
    console.log(data);
    this.props.socket.emit('mutateCharacter', data);
  },
  onNameChange: function(ev) {
    this.onChange('name', ev.target.value);
  },
  onDisplayNameChange: function(ev) {
    this.onChange('displayName', ev.target.value);
  },
  onTypeChange: function(ev) {
    this.onChange('type', ev.target.value);
  },
  onInitRollChange: function(ev) {
    this.onChange('initRoll', ev.target.value);
  },
  onInitBonusChange: function(ev) {
    this.onChange('initBonus', ev.target.value);
  },
  onInitRandChange: function(ev) {
    this.onChange('initRand', ev.target.value);
  },
  onHPDamageStrChange: function(ev) {
    this.onChange('hpDamageStr', ev.target.value);
  },
  onHPDamageChange: function(ev) {
    this.onChange('hpDamage', ev.target.value);
  },
  onHPMaxChange: function(ev) {
    this.onChange('hpMax', ev.target.value);
  },
  onTagsChange: function(ev) {
    this.onChange('tags', ev.target.value);
  },
  onInvolvedChange: function(ev) {
    this.onChange('involved', ev.target.checked);
  },
  onShowCharChange: function(ev) {
    this.onChange('showChar', ev.target.checked);
  },
  onShowInitChange: function(ev) {
    this.onChange('showInit', ev.target.checked);
  },
  onShowDamageChange: function(ev) {
    this.onChange('showDamage', ev.target.checked);
  },
  onShowHPChange: function(ev) {
    this.onChange('showHP', ev.target.checked);
  },
  render: function() {
    var data = this.props.data;
    return <tr>
      <td><input ref="name" value={data.name} onChange={this.onNameChange} /></td>
      <td><input ref="displayName" value={data.displayName} onChange={this.onDisplayNameChange} /></td>
      <td>
        <select ref="type" value={data.type} onChange={this.onTypeChange} >
          <option value="PC">PC</option>
          <option value="NPC">NPC</option>
          <option value="ENEMY">ENEMY</option>
        </select>
      </td>
      <td><input ref="initRoll" value={data.initRoll} onChange={this.onInitRollChange} /></td>
      <td><input ref="initBonus" value={data.initBonus} onChange={this.onInitBonusChange} /></td>
      <td><input ref="initRand" value={data.initRand} onChange={this.onInitRandChange} /></td>
      <td><input ref="hpDamageStr" value={data.hpDamageStr} onChange={this.onHPDamageStrChange} /></td>
      <td><input ref="hpDamage" value={data.hpDamage} onChange={this.onHPDamageChange} /></td>
      <td><input ref="hpMax" value={data.hpMax} onChange={this.onHPMaxChange} /></td>
      <td><input ref="tags" value={data.tags} onChange={this.onTagsChange} /></td>
      <td><input type="checkbox" ref="involved" checked={data.involved} onChange={this.onInvolvedChange} /></td>
      <td><input type="checkbox" ref="showChar" checked={data.showChar} onChange={this.onShowCharChange} /></td>
      <td><input type="checkbox" ref="showInit" checked={data.showInit} onChange={this.onShowInitChange} /></td>
      <td><input type="checkbox" ref="showDamage" checked={data.showDamage} onChange={this.onShowDamageChange} /></td>
      <td><input type="checkbox" ref="showHP" checked={data.showHP} onChange={this.onShowHPChange} /></td>
      <td></td>
    </tr>;
  }
});
