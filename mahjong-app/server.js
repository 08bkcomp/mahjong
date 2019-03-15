const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const io = require('socket.io')();
const app = express();
const port = process.env.PORT || 5000

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var games = [];
var unassignedPlayers = [];
var partialGames = [];
var lobbyInfo = {players: unassignedPlayers, games= partialGames,};

io.on('connection', (client) => {
		console.log('new player connected: ' + client.id);
		client.on('join lobby', nickname => {
				unassignedPlayers[client.id] = nickname;
				client.join('lobby');
				client.to('lobby').emit('update lobby', newPlayerName);
				client.emit('create lobby', lobbyInfo)
		});
		client.on('create game', gamename => {
				newGame = {
						gamename: gamename,
						players: [client.id,],
						active: false,
				};
		});
});

io.listen(port);
console.log('listening on port ', port);
