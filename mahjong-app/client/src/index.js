import React from 'react';
import ReactDOM from 'react-dom';
import { Switch, Route, BrowserRouter } from 'react-router-dom';
import socket from './socket';
import Board from './InGame';
import Lobby from './Lobby';
import Splash from './Splash';
import "https://maxcdn.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css";
import './index.css';

ReactDOM.render(
		<BrowserRouter>
			<Switch>
				<Route exact path='/' component={Splash}/>
				<Route path='/lobby' component={Lobby}/>
				<Route path='/game/:gameId' component={Board}/>
			</Switch>
		</BrowserRouter>
,document.getElementById('root'));

