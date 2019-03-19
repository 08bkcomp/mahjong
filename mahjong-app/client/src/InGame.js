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

var pieceback = '\u{1F02B}';

function Piece(props) {
  var comment = props.comment ? props.comment : '';
  return <div class={props.class}>{comment + props.piece}</div>;
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
      <ActionItem active={props.actions.chow} action="Chow" />
      <ActionItem active={props.actions.pung} action="Pung" />
      <ActionItem active={props.actions.kong} action="Kong" />
      <ActionItem active={props.actions.eye} action="Eye (M)" />
      <ActionItem active={props.actions.rob} action="Rob (M)" />
      <ActionItem active={props.actions.mahjong} action="Mahjong" />
    </div>
  );
}

function GameInfo(props) {
  return (
    <div class="gameinfo">
      <Piece
        class="focuspiece littleinfo"
        piece={winds[props.publicInfo.round]}
        comment="R:"
      />
      <Piece
        class="focuspiece littleinfo"
        piece={winds[props.myGameState.wind]}
        comment="P:"
      />
      <div class="littleinfo">{props.publicInfo.numPiecesLeft}</div>
      <ActionList actions={props.myGameState.actions} />
    </div>
  );
}

function ExposedGroup(props) {
  if (props.pieceGroup.isConcealed) {
    props.pieceGroup.pieces[1] = pieceback;
    props.pieceGroup.pieces[2] = pieceback;
  }
  return (
    <div>
      {props.pieceGroup.pieces.map((piece, i) => {
        return <Piece class={props.class} piece={piece} />;
      })}
    </div>
  );
}

function ExposedHand(props) {
  return (
    <div class={props.divclass}>
      {props.exposed.map((pieceGroup, i) => {
        return <ExposedGroup pieceGroup={pieceGroup} class={props.class} />;
      })}
    </div>
  );
}

function OpHand(props) {
  return (
    <div class="opponent">
      <div class="opwind otherpiece">{winds[props.wind]}</div>
      <ExposedHand
        class="otherpiece"
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
            class="focuspiece"
            divclass="myexposed"
            exposed={props.exposed}
          />
        </Alert>
      </Row>
      <Row>
        <Alert variant="info">
          <div class={'myexposed'}>
            {props.hand.map((piece, i) => {
              return <Piece class="focuspiece" piece={piece} />;
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
      },
    );
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
            {this.state.publicInfo.discards.map((piece, i) => {
              return <Piece class="focuspiece" piece={piece} />;
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
