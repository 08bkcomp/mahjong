import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import socket from './socket';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

function ManageGame(props) {
		return (
				<div class="gamemanager">
					<Card>
						<Card.Title>{"Manage Game"}</Card.Title>
						<DeleteGameButton />
					</Card>
				</div>
		);
}

function CreateGame(props) {
		return (
				<div class="gamemanager">
					<Card>
						<Card.Title>{"Create Game"}</Card.Title>
						<Button variant="info" onClick={e => createGameHandler(e)} />
					</Card>
				</div>
		);
}

export default class CreateGame extends Component {
		constructor(props) {
				super(props);
				this.state = {
						haveOwnGame: false,
						myGameInfo: {},
				}
		}

		render() {
				if(this.state.haveOwnGame) {
						return <ManageGame myGameInfo={this.state.myGameInfo} />;
				}
				return <CreateGame />;
		}
}
