import React, {Component} from 'react';
import socket from './socket';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';

let createGameHandler;
let deleteGameHandler;
let updateMyGameNameHandler;
let startGameHandler;

function ManageGame(props) {
  return (
    <Card>
      <Card.Title>{props.gamename}</Card.Title>
      <ListGroup variant="flush">
        {props.myGameInfo.playerUsernames.map((playername, i) => {
          return <ListGroup.Item>{playername}</ListGroup.Item>;
        })}
      </ListGroup>
      <Button variant="danger" onClick={deleteGameHandler} block>
        {'Delete Game'}
      </Button>
      {props.myGameInfo.playerUsernames.length > 1 ? (
        <Button variant="success" onClick={startGameHandler} block>
          {'Start Game'}
        </Button>
      ) : null}
    </Card>
  );
}

function CreateGameCard(props) {
  return (
    <Card>
      <Card.Title>{'Create Game'}</Card.Title>
      <Form.Control
        type="text"
        value={props.myGameName}
        placeholder={'Game Name'}
        onChange={updateMyGameNameHandler}
      />
      <Button variant="info" onClick={createGameHandler}>
        {'Create Game'}
      </Button>
    </Card>
  );
}

export default class CreateGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: null,
      myGameName: null,
      myGameInfo: {},
    };

    socket.on('confirm game created', gameInfo => {
      this.setState({status: 'have own game', myGameInfo: gameInfo});
    });
    socket.on('confirm game deleted', () => {
      this.setState({
        status: null,
        myGameName: null,
        myGameInfo: {},
      });
    });
    socket.on('invalid gamename', () => {
      alert('There is already a game with this name');
    });
    socket.on('update created game', gameInfo => {
      this.setState({myGameInfo: gameInfo});
    });
    socket.on('disable create game', () => {
      this.setState({status: 'in other game'});
    });
    socket.on('enable create game', () => {
      this.setState({status: null});
    });

    updateMyGameNameHandler = this.updateMyGameNameHandler;
    createGameHandler = this.createGameHandler;
    deleteGameHandler = this.deleteGameHandler;
    startGameHandler = this.startGameHandler;
  }

  updateMyGameNameHandler = event => {
    this.setState({myGameName: event.target.value});
  };

  createGameHandler = () => {
    socket.emit('create game', this.state.myGameName);
  };

  deleteGameHandler = () => {
    socket.emit('delete game', this.state.myGameName);
  };

  startGameHandler = () => {
    socket.emit('start game', this.state.myGameName);
  };

  render() {
    switch (this.state.status) {
      case 'have own game':
        return (
          <ManageGame
            gamename={this.state.myGameName}
            myGameInfo={this.state.myGameInfo}
          />
        );
      case 'in other game':
        return (
          <Card>
            <Card.Title>{'You are in another game'}</Card.Title>
            <Card.Text>
              {
                'Please leave the game you are in before trying to create a new game.'
              }
            </Card.Text>
          </Card>
        );
      default:
        return <CreateGameCard myGameName={this.state.myGameName} />;
    }
  }
}
