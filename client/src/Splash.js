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
    this.state = {playerCreated: false, redirect: false};
    setInterval(() => {
      console.log(this.state);
    }, 5000);
    this.redirectToLogin = this.redirectToLogin.bind(this);
  }

  redirectToLogin = () => {
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(result => {
        console.log('user data from google');
        console.log(result.user);
        socket.emit('create player', result.user.email);
        this.setState({playerCreated: true});
        setTimeout(() => {
          this.setState({redirect: true});
        }, 1500);
      })
      .catch(error => {
        console.log(error);
      });
  };

  render() {
    if (this.state.redirect) {
      return <Redirect to="/lobby" />;
    }
    if (this.state.playerCreated) {
      return (
        <Alert>
          <Alert.Heading>Redirecting to lobby...</Alert.Heading>
        </Alert>
      );
    }
    return (
      <Alert>
        <Alert.Heading>Please login with provider...</Alert.Heading>
        <Button onClick={this.redirectToLogin}>Go to login</Button>
      </Alert>
    );
  }
}
