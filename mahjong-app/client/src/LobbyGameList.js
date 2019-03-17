import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import CardColumns from 'react-bootstrap/CardColumns';

let joinGameHandler;
let leaveGameHandler;
//let createGameHandler;
//let deleteGameHandler;

function LeaveGameButton(props) {
		return (
				<Button
					variant="warning"
					onClick={leaveGameHandler}
					block
					>
						{"Leave Game"}
				</Button>
		);
}

function JoinGameButton(props) {
		return (
				<Button
					variant="primary"
					onClick={joinGameHandler}
					disabled={props.enoughPlayers}
					block
					>
						{"Join Game"}
				</Button>
		);
}

//function CreateGameButton(props) {
//		return (
//				<Button
//					variant="info"
//					onClick={createGameHandler}
//					disabled={props.pidAlreadyOwnsGame}
//					block
//					>
//						{"Create Game"}
//				</Button>
//		);
//}

//function DeleteGameButton(props) {
//		return (
//				<Button
//					variant="danger"
//					onClick={deleteGameHandler}
//					block
//					>
//						{"Delete Game"}
//				<Button>
//		);
//}

function GameItem(props) {
		if(props.game.owner == socket.id) {return null;};
		var pidInGame = props.game.players.includes(socket.id);
		var enoughPlayers = props.game.players.length == 4;
		return (
				<Card>
					<Card.Body>
						<Card.Title>
							{props.gamename}
							<Badge variant="dark">{props.game.players.length}</Badge>
						</Card.Title>
						{pidInGame ? <LeaveGameButton/> : <JoinGameButton enoughPlayers={enoughPlayers}/>}
					</Card.Body>
				</Card>
		);
}

//function OwnedGameItem(props) {
//		return (
//				<Card>
//					<Card.Body>
//						<Card.Title>
//							{props.gamename}
//							<Badge variant="dark">{props.players.length}</Badge>
//						</Card.Title>
//						<Button
//					</Card.Body>
//				</Card>
//		);
//}

export default class GameList extends Component {
		constructor(props) {
				super(props);
				this.state = {
						gamenames: [],
						games: {},
				}

				socket.on('load games', partialGames => {
						this.setState({
								gamenames: Object.keys(partialGames),
								games: partialGames,
						});
				});

				socket.emit('load games');
		}

		render() {
				return (
						<CardColumns>
							{this.state.gamenames.map((gamename, i) => {
									return <GameItem gamename={gamename} game={this.state.games[gamename]} />;
							})}
						</CardColumns>
				);
		}
}
