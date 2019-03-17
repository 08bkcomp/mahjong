import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';

function PlayerItem(props) {
		var class = "playeritem" + (props.light ? " light" : " dark");
		return (
				<li class={class}>{props.nickname}</li>
		);
}

export default class PlayerList extends Component {
		constructor(props) {
				super(props);
				this.state = {
						players = [],
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
							<h1>{"Other Players"}</h1>
							<div class="playerlist">
								{this.state.players.map((nickname, i) => {
										var light = (i % 2) == 0;
										return <PlayerItem light={light} nickname={nickname}/>
								})}
							</div>
						</div>
				);
		}
}
