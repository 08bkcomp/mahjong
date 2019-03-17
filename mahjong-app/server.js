const express = require('express');
//const bodyParser = require('body-parser');
const path = require('path');
const io = require('socket.io')();
const app = express();
const port = process.env.PORT || 5000;

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));

var games = {};
var unassignedPidToName = {};
var unassignedNameToPid = {};
var assignedPidToName = {};
var assignedNameToPid = {};
var partialGames = {};
var lobbyInfo = {players: unassignedPidToName, games: partialGames,};

io.on('connection', (client) => {
		console.log('new player connected: ' + client.id);
		
		client.on('create player', nickname => {
				if(nickname in unassignedNameToPid || nickname in assignedNameToPid){
						client.emit('name already exists');
				} else {
						unassignedPidToName[client.id] = nickname;
						unassignedNameToPid[nickname] = client.id;
						client.to('lobby').emit('load players', nickname);
						client.emit('name created');
						console.log('created player: '+nickname);
				}
		});

		client.on('join lobby', () => {
				client.join('lobby');
		});

		client.on('load players', () => {
				client.emit('load players', unassignedPidToName);
		});

		client.on('load games', () => {
				client.emit('load games', partialGames);
		});

		client.on('create game', gamename => {
				if(gamename in partialGames || gamename in games) {
						client.emit('invalid gamename');
				} else {
						partialGames[gamename] = {
								players: [client.id,],
								owner: client.id,
						};
				}
		});

		client.on('disconnect', () => {
				console.log("player disconnected: "+client.id);
		});
});

io.listen(port);
console.log('listening on port ', port);
