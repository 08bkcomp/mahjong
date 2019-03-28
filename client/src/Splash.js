import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import socket from './socket';

var firebase = require('firebase');
var config = {
  apiKey: 'AIzaSyB2RDY7MVXSuWZj73ZZhX4AWo5phJKPjek',
  authDomain: 'mahjong-user-auth.firebaseapp.com',
  databaseURL: 'https://mahjong-user-auth.firebaseio.com',
  projectId: 'mahjong-user-auth',
  storageBucket: 'mahjong-user-auth.appspot.com',
  messagingSenderId: '188181150298',
};
firebase.initializeApp(config);
var provider = new firebase.auth.GoogleAuthProvider();

export default class Splash extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: null,
    };

    socket.on('username already exists', () => {
	    this.setState({status: 'invalid username'});
    });
    socket.on('username created', () => {
	    this.setState({status: 'username created'});
    });
  }

  redirectToLogin = () => {
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(result => {
        console.log('user data from google');
        console.log(result.user);
        socket.emit('create player', result.user.email);
        this.setState({status: 'creating username'});
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    switch (this.state.status) {
      case 'username created':
        return <Redirect to="/lobby" />;
      case 'creating username':
        return (
          <Alert>
            <Alert.Heading>
		Creating user...
            </Alert.Heading>
          </Alert>
        );
      case 'invalid username':
        setTimeout(() => {
          this.setState({status: null});
        }, 5000);
        return (
          <Alert>
            <Alert.Heading>
              It seems like you are already logged in.
            </Alert.Heading>
          </Alert>
        );
      default:
        return (
          <Alert>
            <Alert.Heading>Please login with provider...</Alert.Heading>
            <Button onClick={this.redirectToLogin}>Go to login</Button>
          </Alert>
        );
    }
  }
}
