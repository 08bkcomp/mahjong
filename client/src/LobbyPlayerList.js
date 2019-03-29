import React, {Component} from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import socket from './socket';
import './LobbyPlayerList.css';

const hashCode = str => {
  let hash = 0,
    chr;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const randColourFromName = nickname => {
  let chunkSize = Math.floor(nickname.length / 4);
  let colorProps = [];
  for (let i = 0; i < 4; i++) {
    let stringChunk = nickname.slice(i * chunkSize, (i + 1) * chunkSize);
    colorProps[i] = hashCode(stringChunk) % 256;
  }
  return `rgb(
  ${colorProps[0]},
  ${colorProps[1]},
  ${colorProps[2]},
		${colorProps[3] / 256})`;
};

function PlayerItem(props) {
  let style = {
    'background-color': randColourFromName(props.nickname),
  };
  return (
    <OverlayTrigger
      placement="right"
      overlay={<Tooltip>{props.nickname}</Tooltip>}>
      <div class={'usericon'} style={style}>
        <p class={'usertext'}>
          <strong>{props.nickname[0]}</strong>
        </p>
      </div>
    </OverlayTrigger>
  );
}

export default class PlayerList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
    };

    socket.on('load players', pidToName => {
      delete pidToName[socket.id];
      this.setState({players: Object.values(pidToName)});
    });

    socket.emit('load players');
  }

  render() {
    return (
      <div class="playerlistcontainer">
        <h1>{'Other Players'}</h1>
        <div class="usertable">
          {this.state.players.map((nickname, i) => {
            return <PlayerItem nickname={nickname} />;
          })}
        </div>
      </div>
    );
  }
}
