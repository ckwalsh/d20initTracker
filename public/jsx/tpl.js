/** @jsx React.DOM */
var InitPage = React.createClass({displayName: 'InitPage',
  propTypes: {
    roomName: React.PropTypes.string.isRequired,
    socket: React.PropTypes.object.isRequired,
  },
  room: {},
  getInitialState: function() {
    return {
      room: {
        key: '',
        title: '',
        currentChar: null,
      },
      characters: [],
    };
  },
  componentDidMount: function() {
    this.props.socket.on('connect', function() {
      this.props.socket.emit('join', {
        room: this.props.roomName,
      });
    }.bind(this));

    this.props.socket.on('updateRoom', function(data) {
      var setState = false;
      for (var k in data) {
        setState = setState || (data[k] !== this.room[k]);
        this.room[k] = data[k];
      }

      if (setState) {
        this.setState({room: this.room});
      }
    }.bind(this));

    this.props.socket.on('setCharacters', function(data) {
      this.setState({characters: data});
    }.bind(this));
  },
  render: function() {
    return <div id="content">
      <InitCurrentInit room={this.state.room} characters={this.state.characters} />
      <InitCampaign room={this.state.room} />
      <InitTable room={this.state.room} characters={this.state.characters} />
    </div>;
  }
});

var InitCurrentInit = React.createClass({displayname: 'InitCurrentInit',
  propTypes: {
    room: React.PropTypes.shape({
      key: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      currentChar: React.PropTypes.string,
    }).isRequired,
    characters: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        key: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        type: React.PropTypes.oneOf(["PC", "NPC", "ENEMY"]).isRequired,
        tags: React.PropTypes.object.isRequired,
        init: React.PropTypes.number,
        hpDamageStr: React.PropTypes.string,
        hpDamage: React.PropTypes.number,
        hpCurrent: React.PropTypes.number,
      })
    ).isRequired,
  },
  render: function() {
    var currentInit = '';
    if (this.props.room.currentChar) {
      for (var i = 0; i < this.props.characters.length; i++) {
        if (this.props.characters[i].key === this.props.room.currentChar) {
          if (typeof this.props.characters[i].init === 'number') {
            currentInit = this.props.characters[i].init;
          }
          break;
        }
      }
    }
    return <div id="currentInitiative">{currentInit}</div>;
  }
});

var InitCampaign = React.createClass({displayName: 'InitCampaign',
  propTypes: {
    room: React.PropTypes.shape({
      key: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      currentChar: React.PropTypes.string,
    }).isRequired,
  },
  render: function() {
    return <div id="campaignHeader"><span className="campaign">{this.props.room.title}</span></div>;
  }
});

var InitTable = React.createClass({displayName: 'InitTable',
  propTypes: {
    room: React.PropTypes.shape({
      key: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      currentChar: React.PropTypes.string,
    }).isRequired,
    characters: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        key: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        type: React.PropTypes.oneOf(["PC", "NPC", "ENEMY"]).isRequired,
        tags: React.PropTypes.object.isRequired,
        init: React.PropTypes.number,
        hpDamageStr: React.PropTypes.string,
        hpDamage: React.PropTypes.number,
        hpCurrent: React.PropTypes.number,
      })
    ).isRequired,
  },
  render: function() {
    var rows = [];
    for (var i = 0; i < this.props.characters.length; i++) {
      var c = this.props.characters[i];
      rows.push(<InitRow key={c.key} data={c} active={c.key === this.props.room.currentChar} />);
    };
    return (
      <div className="initTable">
        {rows}
      </div>
    );
  }
});
var InitRow = React.createClass({displayName: 'InitRow',
  propTypes: {
    data: React.PropTypes.shape({
      key: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      type: React.PropTypes.oneOf(["PC", "NPC", "ENEMY"]).isRequired,
      tags: React.PropTypes.object.isRequired,
      init: React.PropTypes.number,
      hpDamageStr: React.PropTypes.string,
      hpDamage: React.PropTypes.number,
      hpCurrent: React.PropTypes.number
    }).isRequired,
    active: React.PropTypes.bool,
  },
  render: function() {
    var cx = React.addons.classSet;
    var cm = {
      'initRow': true,
      'active': this.props.active,
      'npc': this.props.type === 'NPC',
      'enemy': this.props.type === 'ENEMY',
    };
    
    var name = this.props.data.name;

    var unclaimedTagsDiv = null;
    if (this.props.data.tags !== undefined) {
      var unclaimedTags = [];
      for (var tag in this.props.data.tags) {
        switch (tag) {
          case 'healthy':
          case 'bloodied':
          case 'unconcious':
          case 'dead':
            cm[tag] = true;
            break;
          default:
            unclaimedTags.push(tag);
        }
      };
      if (unclaimedTags.length > 0) {
        unclaimedTags.sort();
        unclaimedTagsDiv = <div className="charTags">
          ({unclaimedTags.join(', ')})
        </div>;
      }
    }

    var healthDiv = null;
    if (this.props.data.hpCurrent !== undefined) {
      var healthStr = '';
      if (this.props.data.hpDamage !== undefined) {
        var hpMax = this.props.data.hpCurrent+this.props.data.hpDamage;
        healthStr = this.props.data.hpCurrent+"/"+hpMax+" hp";
      } else {
        healthStr = this.props.data.hpCurrent+" hp";
      }
      healthDiv = <div className="health">
        {healthStr}
      </div>;
    }

    var damageDiv = null;
    if (this.props.data.hpDamage !== undefined) {
      damageDiv = <div className="damage">
        ({this.props.data.hpDamage} dmg)
      </div>;
    }
    
    return (<div className={cx(cm)}>
      <div className="charInit">{this.props.data.init}</div>
      <div className="charName">{name}</div>
      {unclaimedTagsDiv}
      {healthDiv}
      {damageDiv}
    </div>);
  }
});
