import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';
import PlayerList from './LobbyPlayerList';
import GameList from './LobbyGameList';

export default class Lobby extends Component {
		constructor(props) {
				super(props);
				socket.emit('join lobby');
		}

		render() {
				return (
						<div class="lobby">
							<GameList />
							<PlayerList />
						</div>
				);
		}
}
