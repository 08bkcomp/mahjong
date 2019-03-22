import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';
import socket from './socket';

let handleClick;
let handleNameChange;

function CreatePlayer(props) {
  return (
    <div>
      <div>{props.state.infomsg}</div>
      <input type="text" value={props.state.name} onChange={handleNameChange} />
      <button onClick={handleClick}>"Create Player"</button>
    </div>
  );
}

export default class Splash extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerCreated: false,
      name: null,
      infomsg: null,
    };

    socket.on('name already exists', () => {
      this.setState({infomsg: 'Player Already Exists'});
    });
    socket.on('name created', () => {
      this.setState({playerCreated: true});
    });

    handleClick = this.handleClick;
    handleNameChange = this.handleNameChange;
  }

  handleClick = () => {
    this.setState({infomsg: 'Creating Player...'});
    socket.emit('create player', this.state.name);
  };

  handleNameChange = event => {
    this.setState({name: event.target.value});
  };

  render() {
    if (this.state.playerCreated) {
      return <Redirect to="/lobby" />;
    }
    return <CreatePlayer state={this.state} />;
  }
}
