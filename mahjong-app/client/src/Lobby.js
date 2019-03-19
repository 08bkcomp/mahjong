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
    this.state = {gameStarted: false};

    socket.on('send users to game board', () => {
      this.setState({
        gameStarted: true,
      });
    });

    socket.emit('join lobby');
  }

  render() {
    if (this.state.gameStarted) {
      return <Redirect to="/game" />;
    }
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
