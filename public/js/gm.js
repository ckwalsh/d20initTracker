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
      return React.DOM.div({id: "content"}, 
        InitGMLogin({socket: this.props.socket})
      );
    } else {
      return React.DOM.div({id: "content"}, 
        InitGMCampaignInfo({socket: this.props.socket, room: this.state.room}), 
        InitGMCharacterInfo({socket: this.props.socket, room: this.state.room, characters: this.state.characters})
      );
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
    return React.DOM.div({id: "gmLogin"}, 
      React.DOM.form({onSubmit: this.onSubmit}, 
        React.DOM.label(null, "Password ", React.DOM.input({type: "text", ref: "password"})), 
        React.DOM.input({type: "submit", value: "Login"})
      )
    );
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
    return React.DOM.div({id: "gmCampaignInfo"}, 
      React.DOM.label(null, "Title: ", React.DOM.input({type: "text", ref: "title", value: this.props.room.title, onChange: this.onTitleChange})), 
      React.DOM.label(null, "Password: ", React.DOM.input({type: "text", ref: "password", value: this.props.room.password, onChange: this.onPasswordChange}))
    );
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
        InitGMCharacterRow({socket: this.props.socket, data: this.props.characters[key], key: key})
      );
    }
    return React.DOM.div({id: "gmCharacterInfo"}, 
      React.DOM.button({onClick: this.onAddCharacter}, "Add Character"), 
      React.DOM.button({onClick: this.onRollInit}, "Roll Init"), 
      React.DOM.table(null, 
        React.DOM.tr(null, 
          React.DOM.th(null, "Name"), 
          React.DOM.th(null, "Display"), 
          React.DOM.th(null, "Type"), 
          React.DOM.th(null, "I Roll"), 
          React.DOM.th(null, "I Bonus"), 
          React.DOM.th(null, "I Rand"), 
          React.DOM.th(null, "HP Dmg Str"), 
          React.DOM.th(null, "HP Dmg"), 
          React.DOM.th(null, "HP Max"), 
          React.DOM.th(null, "Tags"), 
          React.DOM.th(null, "Involved?"), 
          React.DOM.th(null, "Show Char"), 
          React.DOM.th(null, "Show Init"), 
          React.DOM.th(null, "Show Damage"), 
          React.DOM.th(null, "Show HP"), 
          React.DOM.th(null, "Actions")
        ), 
        rows
      )
    );
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
    return React.DOM.tr(null, 
      React.DOM.td(null, React.DOM.input({ref: "name", value: data.name, onChange: this.onNameChange})), 
      React.DOM.td(null, React.DOM.input({ref: "displayName", value: data.displayName, onChange: this.onDisplayNameChange})), 
      React.DOM.td(null, 
        React.DOM.select({ref: "type", value: data.type, onChange: this.onTypeChange}, 
          React.DOM.option({value: "PC"}, "PC"), 
          React.DOM.option({value: "NPC"}, "NPC"), 
          React.DOM.option({value: "ENEMY"}, "ENEMY")
        )
      ), 
      React.DOM.td(null, React.DOM.input({ref: "initRoll", value: data.initRoll, onChange: this.onInitRollChange})), 
      React.DOM.td(null, React.DOM.input({ref: "initBonus", value: data.initBonus, onChange: this.onInitBonusChange})), 
      React.DOM.td(null, React.DOM.input({ref: "initRand", value: data.initRand, onChange: this.onInitRandChange})), 
      React.DOM.td(null, React.DOM.input({ref: "hpDamageStr", value: data.hpDamageStr, onChange: this.onHPDamageStrChange})), 
      React.DOM.td(null, React.DOM.input({ref: "hpDamage", value: data.hpDamage, onChange: this.onHPDamageChange})), 
      React.DOM.td(null, React.DOM.input({ref: "hpMax", value: data.hpMax, onChange: this.onHPMaxChange})), 
      React.DOM.td(null, React.DOM.input({ref: "tags", value: data.tags, onChange: this.onTagsChange})), 
      React.DOM.td(null, React.DOM.input({type: "checkbox", ref: "involved", checked: data.involved, onChange: this.onInvolvedChange})), 
      React.DOM.td(null, React.DOM.input({type: "checkbox", ref: "showChar", checked: data.showChar, onChange: this.onShowCharChange})), 
      React.DOM.td(null, React.DOM.input({type: "checkbox", ref: "showInit", checked: data.showInit, onChange: this.onShowInitChange})), 
      React.DOM.td(null, React.DOM.input({type: "checkbox", ref: "showDamage", checked: data.showDamage, onChange: this.onShowDamageChange})), 
      React.DOM.td(null, React.DOM.input({type: "checkbox", ref: "showHP", checked: data.showHP, onChange: this.onShowHPChange})), 
      React.DOM.td(null)
    );
  }
});
