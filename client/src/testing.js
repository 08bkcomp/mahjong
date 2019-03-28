import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import socket from './socket';

export default class Testing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: null,
    };
    socket.emit('create player', String(Date.now()));
    socket.on('username created', () => {
      this.setState({status: 'username created'});
    });
  }

  render() {
    switch (this.state.status) {
      case 'username created':
        return <Redirect to="/lobby" />;
      default:
        return (
          <Alert>
            <Alert.Heading>
              Creating a user...
            </Alert.Heading>
          </Alert>
        );
    }
  }
}
