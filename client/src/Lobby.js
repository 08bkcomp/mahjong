import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';
import socket from './socket';
import PlayerList from './LobbyPlayerList';
import GameList from './LobbyGameList';
import CreateGame from './LobbyCreateGame';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

export default class Lobby extends Component {
  constructor(props) {
    super(props);
    this.state = {status: null};

    socket.on('send users to game board', () => {
      this.setState({
        status: 'game started',
      });
    });
    socket.on('unregistered user', () => {
      this.setState({
        status: 'unregistered',
      });
    });
    socket.emit('check registration');
  }

  render() {
    switch (this.state.status) {
      case 'game started':
        return <Redirect to="/game" />;
      case 'unregistered':
        return <Redirect to="/" />;
      default:
        return (
          <Container>
            <Row>
              <Col>
                <CreateGame />
              </Col>
              <Col>
                <GameList />
              </Col>
              <Col>
                <PlayerList />
              </Col>
            </Row>
          </Container>
        );
    }
  }
}
