import React from 'react';
import ReactDOM from 'react-dom';
import { Switch, Route, BrowserRouter } from 'react-router-dom';
import openSocket from 'socket.io-client';
import './index.css';
import Board from './InGame';
import Lobby from './Lobby';
import Splash from './Splash';

const socket = openSocket('http://localhost:5000')

ReactDOM.render(
		<BrowserRouter>
			<Switch>
				<Route exact path='/' component={Splash}/>
				<Route path='/lobby/:lobbyId' component={Lobby}/>
				<Route path='/game/:gameId' component={Board}/>
			</Switch>
		</BrowserRouter>
,document.getElementById('root'));

