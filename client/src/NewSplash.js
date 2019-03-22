import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';
import socket from './socket';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

export default class Splash extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playerCreated: false,
      username: null,
      usernameExists: false,
    };
    socket.on('name already exists', () => {
      this.setState({usernameExists: true});
    });
    socket.on('name created', () => {
      document.removeEventListener('keydown', this.enterHandler);
      this.setState({playerCreated: true});
    });

    document.addEventListener('keydown', this.enterHandler);
  }

  enterHandler = event => {
    console.log(event.key);
    if (event.key == 'Enter') {
      this.createUser();
    }
  };

  handleNameChange = event => {
    this.setState({username: event.target.value, usernameExists: false});
  };

  createUser = () => {
    socket.emit('create player', this.state.username);
  };

  render() {
    if (this.state.playerCreated) {
      return <Redirect to="/lobby" />;
    }
    return (
      <InputGroup className="mb-3">
        <Form.Control
          placeholder="Username"
          value={this.state.username}
          onChange={this.handleNameChange}
        />
        <InputGroup.Append>
          {this.state.usernameExists ? (
            <Button variant="outline-danger">Invalid Username</Button>
          ) : (
            <Button variant="success" onClick={this.createUser}>
              Create User
            </Button>
          )}
        </InputGroup.Append>
      </InputGroup>
    );
  }
}
