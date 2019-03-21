import React, {Component} from 'react';
import Alert from 'react-bootstrap/Alert';
import './InGame.css';
import './index.css';
import socket from './socket';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

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

function ActionItem(props) {
  return (
    <div class={props.active ? 'actionactive' : 'actioninactive'}>
      <span>{props.action}</span>
    </div>
  );
}

function ActionList(props) {
  return (
    <div class="actionlist">
      <ActionItem active={props.actions.draw} action="Draw" />
      <ActionItem active={props.actions.discard} action="Discard" />
      <ActionItem active={props.actions.chow} action="Chow" />
      <ActionItem active={props.actions.pung} action="Pung" />
      <ActionItem active={props.actions.kong} action="Kong" />
      {props.actions.eye ? (
        <ActionItem active={props.actions.eye} action="Eye (M)" />
      ) : null}
      {props.actions.eye ? (
        <ActionItem active={props.actions.rob} action="Rob (M)" />
      ) : null}
      <ActionItem active={props.actions.mahjong} action="Mahjong" />
    </div>
  );
}

function GameInfo(props) {
  return (
    <div class="gameinfo">
      <Tile
        class="focustile littleinfo"
        tile={winds[props.publicInfo.round]}
        comment="R:"
      />
      <Tile
        class="focustile littleinfo"
        tile={winds[props.myGameState.wind]}
        comment="P:"
      />
      <div class="littleinfo">{props.publicInfo.numTilesLeft}</div>
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
    <div>
      {props.tileGroup.tiles.map((tile, i) => {
        return <Tile class={props.class} tile={tile} />;
      })}
    </div>
  );
}

function ExposedHand(props) {
  return (
    <div class={props.divclass}>
      {props.exposed.map((tileGroup, i) => {
        return <ExposedGroup tileGroup={tileGroup} class={props.class} />;
      })}
    </div>
  );
}

function OpHand(props) {
  return (
    <div class="opponent">
      <div class="opwind othertile">{winds[props.wind]}</div>
      <ExposedHand
        class="othertile"
        divclass="ophand"
        exposed={props.exposed}
      />
    </div>
  );
}

function MyHand(props) {
  return (
    <Container>
      <Row>
        <Alert variant="warning">
          <ExposedHand
            class="focustile"
            divclass="myexposed"
            exposed={props.exposed}
          />
        </Alert>
      </Row>
      <Row>
        <Alert variant="info">
          <div class={'myexposed'}>
            {props.hand.map((tile, i) => {
              return <Tile class="focustile" tile={tile} />;
            })}
          </div>
        </Alert>
      </Row>
    </Container>
  );
}

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameLoaded: false,
      publicInfo: null,
      myGameState: null,
      otherExposed: null,
    };
    socket.on(
      'reload game state',
      (publicInfo, personalGameState, otherExposed) => {
        this.setState({
          gameLoaded: true,
          publicInfo: publicInfo,
          myGameState: personalGameState,
          otherExposed: otherExposed,
        });
        if (this.state.myGameState.actions.discard) {
        }
      },
    );
    // set up listener for number key presses to discard a tile
    document.addEventListener('keydown', event => {
      if (
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(event.key)
      ) {
        var index = Number.parseInt(event.key);
        var index = index == 0 ? 9 : index - 1;
        //console.log('number between 1 and 10, the index is ' + index);
        if (
          index < this.state.myGameState.hand.length &&
          this.state.myGameState.actions.discard
        ) {
          socket.emit('discard tile', index);
          //console.log('index less than hand');
        }
      }
      switch (event.key) {
        case '-':
          var index = 10;
        case '=':
          var index = 11;
        case '[':
          var index = 12;
        case ']':
          var index = 13;
          if (
            index < this.state.myGameState.hand.length &&
            this.state.myGameState.actions.discard
          ) {
            socket.emit('discard tile', index);
            break;
          }
      }
    });
  }

  render() {
    if (!this.state.gameLoaded) {
      return (
        <Alert>
          <Alert.Heading>Game loading...</Alert.Heading>
          <p>{'Please wait while we set up a new game for you.'}</p>
        </Alert>
      );
    }

    if (false) {
      console.log(this.state);
      return <div>{'game loaded'}</div>;
    }

    console.log(this.state);
    return (
      <div class="board">
        <GameInfo
          publicInfo={this.state.publicInfo}
          myGameState={this.state.myGameState}
        />
        <div class="mainboard">
          <div class="otherhands">
            {Object.keys(this.state.otherExposed).map((wind, i) => {
              return (
                <OpHand wind={wind} exposed={this.state.otherExposed[wind]} />
              );
            })}
          </div>
          <div class="discards">
            {this.state.publicInfo.discards.map((tile, i) => {
              return <Tile class="focustile" tile={tile} />;
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
