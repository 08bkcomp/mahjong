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

function LeaveGameButton(props) {
		return (
				<Button
					variant="warning"
					onClick={() => leaveGameHandler(props.gamename)}
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
					onClick={() => joinGameHandler(props.gamename)}
					block
					>
						{"Join Game"}
				</Button>
		);
}

function GameItem(props) {
		if(props.game.owner == socket.id) {return null;};
		var pidInGame = props.game.players.includes(socket.id);
		var enoughPlayers = props.game.players.length == 4;
		if(enoughPlayers) {
				return (						
						<Card>
							<Card.Body>
								<Card.Title>
									{props.gamename}
									<Badge variant="dark">{props.game.players.length}</Badge>
								</Card.Title>
								<Card.Text>{"This game is full"}</Card.Text>
							</Card.Body>
						</Card>
				);
		}
		return (
				<Card>
					<Card.Body>
						<Card.Title>
							{props.gamename}
							<Badge variant="dark">{props.game.players.length}</Badge>
						</Card.Title>
						{pidInGame ?
								<LeaveGameButton gamename={props.gamename}/> : 
								<JoinGameButton gamename={props.gamename}/>}
					</Card.Body>
				</Card>
		);
}

export default class GameList extends Component {
		constructor(props) {
				super(props);
				this.state = {
						joinedGame: false,
						myGame: null,
						myGameName: null,
						gamenames: [],
						games: {},
						hasOwnGame: false,
				}
				joinGameHandler = this.joinGameHandler;
				leaveGameHandler = this.leaveGameHandler;

				socket.on('load games', partialGames => {
						this.setState({
								gamenames: Object.keys(partialGames),
								games: partialGames,
						});
				});
				socket.on('disable join games', () => {
						alert('disabling joining games');
						this.setState({hasOwnGame: true});
				});
				socket.on('enable join games', () => {
						this.setState({hasOwnGame: false});
				});
				socket.on('confirm game joined', (gamename, gameinfo) => {
						this.setState({
								joinedGame: true,
								gameinfo: gameinfo,
								gamename: gamename,
						});
				});
				socket.on('force leave game', () => {
						alert('The owner has deleted the game.');
						this.setState({
								joinedGame: false,
								gameinfo: null,
								gamename: null,
						});
				});
				socket.on('confirm game left', partialGames => {
						this.setState({
								joinedGame: false,
								gameinfo: null,
								gamename: null,
								gamenames: Object.keys(partialGames),
								games: partialGames,
						});
				});
				socket.on('update joined game', gameinfo => {
						this.setState({
								gameinfo: gameinfo,
						});
				});

				socket.emit('load games');
		}

		joinGameHandler = gamename => {
				socket.emit('join game', gamename);
		}

		leaveGameHandler = gamename => {
				socket.emit('leave game', gamename);
		}

		render() {
				if(this.state.joinedGame) {
						return <GameItem gamename={this.state.gamename} game={this.state.gameinfo}/>;
				} else if (this.state.hasOwnGame) {
						return (
								<Card>
									<Card.Title>{"You have made a game"}</Card.Title>
									<Card.Text>{"Please delete your game before joining someone else's."}</Card.Text>
								</Card>
						);
				}
				return (
						<CardColumns>
							{this.state.gamenames.map((gamename, i) => {
									return <GameItem gamename={gamename} game={this.state.games[gamename]} />;
							})}
						</CardColumns>
				);
		}
}
