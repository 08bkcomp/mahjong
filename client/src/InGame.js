import React, {Component} from 'react';
import {Redirect} from 'react-router-dom';
import './InGame.css';
import './index.css';
import socket from './socket';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Badge from 'react-bootstrap/Badge';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';

var winds = {
  east: '\u{1F000}',
  south: '\u{1F001}',
  west: '\u{1F002}',
  north: '\u{1F003}',
};

var tileback = '\u{1F02B}';

function Tile(props) {
  var comment = props.comment ? props.comment : '';
  return <div class={props.class}>{comment + props.tile}</div>;
}

function ActionList(props) {
  var activeVariant = 'info';
  var inactiveVariant = 'outline-secondary';
  return (
    <ButtonGroup vertical>
      <Button variant={props.actions.draw ? activeVariant : inactiveVariant}>
        Draw
      </Button>
      <Button variant={props.actions.discard ? activeVariant : inactiveVariant}>
        Discard
      </Button>
      <Button variant={props.actions.chow ? activeVariant : inactiveVariant}>
        Chow
      </Button>
      <Button variant={props.actions.pung ? activeVariant : inactiveVariant}>
        Pung
      </Button>
      <Button variant={props.actions.kong ? activeVariant : inactiveVariant}>
        Kong
      </Button>
    </ButtonGroup>
  );
}

function GameInfo(props) {
  return (
    <div class="game-info">
      <Tile
        class="large-tile game-status"
        tile={winds[props.publicInfo.round]}
        comment="R:"
      />
      <Tile
        class="large-tile game-status"
        tile={winds[props.myGameState.wind]}
        comment="P:"
      />
      <div class="game-status">{props.publicInfo.numTilesLeft}</div>
      <ActionList actions={props.myGameState.actions} />
    </div>
  );
}

function ExposedGroup(props) {
  if (props.tileGroup.isConcealed) {
    props.tileGroup.tiles[1] = tileback;
    props.tileGroup.tiles[2] = tileback;
  }
  return (
    <div class="medium-tile">
      {props.tileGroup.tiles.map((tile, i) => {
        return tile;
      })}
    </div>
  );
}

function ExposedHand(props) {
  var tiles = [];
  let i;
  for (i = 0; i < props.exposed.length; i++) {
    var tileGroup = props.exposed[i];
    tiles = [...tiles, ...tileGroup.tiles];
  }
  return (
    <div class={props.class}>
      {tiles.map((tile, i) => {
        return tile;
      })}
    </div>
  );
}

function OpHand(props) {
  return (
    <div class="single-opponent">
      <div class="opponent-wind medium-tile">{winds[props.wind]}</div>
      <ExposedHand class="medium-tile" exposed={props.exposed} />
    </div>
  );
}

function MyHand(props) {
  return (
    <Container>
      <Row>
        <Alert variant="info">
          <div class="large-tile">
            {props.hand.map((tile, i) => {
              return tile;
            })}
          </div>
        </Alert>
        <Alert variant="warning">
          <ExposedHand class="large-tile" exposed={props.exposed} />
        </Alert>
      </Row>
    </Container>
  );
}

function ShowExposureOptions(props) {
  return (
    <Container>
      {props.tileGroups.map((tileGroup, i) => {
        return (
          <Alert variant={i % 2 === 0 ? 'dark' : 'light'}>
            <Badge variant="dark">{i + 1}</Badge>
            <ExposedGroup class="large-tile" tileGroup={tileGroup} />
          </Alert>
        );
      })}
    </Container>
  );
}

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: null,
      gameLoaded: false,
      publicInfo: null,
      myGameState: null,
      otherExposed: null,
    };
    socket.on('unregistered user', () => {
      this.setState({
        status: 'unregistered',
      });
    });
    socket.on(
      'reload game state',
      (publicInfo, personalGameState, otherExposed) => {
        this.setState({
          status: null,
          showActions: null,
          gameLoaded: true,
          publicInfo: publicInfo,
          myGameState: personalGameState,
          otherExposed: otherExposed,
        });
      },
    );
    // set up listener for any possible actions
    document.addEventListener('keydown', event => {
      console.log(`pressed key: ${event.key}`);
      // =========================================
      //  handler for discarding a tile
      // =========================================
      var index = null;
      if (
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(event.key)
      ) {
        index = Number.parseInt(event.key);
        index = index === 0 ? 9 : index - 1;
        console.log('number between 1 and 10, the index is ' + index);
      }
      switch (event.key) {
        case '-':
          index = 10;
          break;
        case '=':
          index = 11;
          break;
        case '[':
          index = 12;
          break;
        case ']':
          index = 13;
          break;
        default:
          break;
      }
      if (
        index != null &&
        index < this.state.myGameState.hand.length &&
        this.state.myGameState.actions.discard
      ) {
        console.log(
          `sent index:${index} less than hand:${
            this.state.myGameState.hand.length
          }`,
        );
        socket.emit('discard tile', index);
      }
      // =========================================
      //  handler for drawing a tile
      // =========================================
      if (event.key === 'd' && this.state.myGameState.actions.draw) {
        socket.emit('draw tile');
      }
      // =========================================
      //  handler for actions
      // =========================================
      var type = null;
      switch (event.key) {
        case 'c':
          type = 'chow';
          break;
        case 'p':
          type = 'pung';
          break;
        case 'k':
          type = 'kong';
          break;
        default:
          break;
      }
      if (type) {
        var actionList = this.state.myGameState.actions[type];
        if (actionList.length === 1) {
          console.log(`one action option, sending to be queued`);
          console.log(actionList[0]);
          socket.emit('queue action', actionList[0]);
        } else {
          console.log(`multiple choices:`);
          console.log(actionList);
          this.setState({showActions: type});
        }
      }
      if (index != null && this.state.showActions) {
        // if we are in here, it means the user is already seeing their action options
        // AND has pressed a number key (hence index != null)
        if (
          index < this.state.myGameState.actions[this.state.showActions].length
        ) {
          var actionList = this.state.myGameState.actions[
            this.state.showActions
          ];
          console.log(`action selected, sending to be queued`);
          console.log(actionList[index]);
          socket.emit('queue action', actionList[index]);
          this.setState({showActions: null});
        }
      }
    });
  }

  render() {
    console.log(this.state);
    if (this.state.status === 'unregistered') {
      return <Redirect to="/" />;
    }

    if (!this.state.gameLoaded) {
      return (
        <Alert>
          <Alert.Heading>Game loading...</Alert.Heading>
          <p>{'Please wait while we set up a new game for you.'}</p>
        </Alert>
      );
    }

    if (this.state.showActions) {
      return (
        <ShowExposureOptions
          tileGroups={this.state.myGameState.actions[this.state.showActions]}
        />
      );
    }

    return (
      <div class="board">
        <GameInfo
          publicInfo={this.state.publicInfo}
          myGameState={this.state.myGameState}
        />
        <div class="main-board">
          <div class="all-opponents">
            {Object.keys(this.state.otherExposed).map((wind, i) => {
              return (
                <OpHand wind={wind} exposed={this.state.otherExposed[wind]} />
              );
            })}
          </div>
          <div class="medium-tile discard-area">
            {this.state.publicInfo.discards.map((tile, i) => {
              return tile;
              // return <Tile class="focustile" tile={tile} />;
            })}
          </div>
          <MyHand
            hand={this.state.myGameState.hand}
            exposed={this.state.myGameState.exposed}
          />
        </div>
      </div>
    );
  }
}

export default Board;
