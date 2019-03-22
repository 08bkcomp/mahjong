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
      usernameValid: false,
    };
    socket.on('name already exists', () => {
      this.setState({usernameValid: true});
    });
    socket.on('name created', () => {
      document.removeEventListener('keydown', this.enterHandler);
      this.setState({playerCreated: true});
    });

    document.addEventListener('keydown', this.enterHandler);
  }
  validateUsername = username => {
    if (username == null) {
      return false;
    }
    if (username.length < 5) {
      return false;
    }
    return true;
  };

  enterHandler = event => {
    console.log(event.key);
    if (event.key == 'Enter' && this.validateUsername(this.state.username)) {
      this.createUser();
    } else {
      this.setState({
        usernameValid: this.validateUsername(this.state.username),
      });
    }
  };

  handleNameChange = event => {
    this.setState({username: event.target.value, usernameValid: false});
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
          {this.state.usernameValid ? (
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
