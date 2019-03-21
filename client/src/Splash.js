import React, { Component } from 'react';
import { Link } from 'react-router-dom';
//import socket from './socket';

let handleClick;
let handleNameChange;

function CreatePlayer(props) {
		return (
				<div>
						<div>{props.state.errmsg}</div>
						<input type="text" value={props.state.name} onChange={handleNameChange}/>
						<button onClick={handleClick}>"Create Player"</button>
				</div>
		);
}

function GoToLobby(props) {
		return (
				<Link to='/lobby'>Go to lobby...</Link>
		);
}

export default class Splash extends Component {
		constructor(props) {
				super(props);
				this.state = {
						playerCreated: false,
						name: null,
						errmsg: null,
				};

				socket.on('name already exists', () => {
						this.setState({errmsg: "Player Already Exists"});
				});
				socket.on('name created', () => {
						this.setState({playerCreated: true});
				});

				handleClick = this.handleClick;
				handleNameChange = this.handleNameChange;
		}

		handleClick = () => {
				this.setState({errmsg: "Creating Player..."});
				socket.emit('create player', this.state.name);
		}

		handleNameChange = event => {
				this.setState({name: event.target.value});
		}

		render() {
				if(this.state.playerCreated) {
						return <GoToLobby />;
				}
				return <CreatePlayer state={this.state} />;
		}
}
