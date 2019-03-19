const express = require('express');
//const bodyParser = require('body-parser');
const path = require('path');
const io = require('socket.io')();
const app = express();
const port = process.env.PORT || 5000;

var games = {};
var pidToName = {};
var nameToPid = {};
var partialGames = {};
var lobbyInfo = {players: pidToName, games: partialGames,};

function distributeGameState(gamename, gameState) {
		var room = 'ingame:'+gamename;
		io.of('/').in(room).clients(function(error, clients) {
				if (clients.length > 0) {
						clients.forEach(function (socket_id) {
								io.sockets.sockets[socket_id].emit('update game board', gameState[socket_id]);
						});
				}
		});
}

io.on('connection', (client) => {
		console.log('new player connected: ' + client.id);
		
		client.on('create player', nickname => {
				if(nickname in nameToPid){
						client.emit('name already exists');
				} else {
						pidToName[client.id] = nickname;
						nameToPid[nickname] = client.id;
						client.to('lobby').emit('load players', pidToName);
						client.emit('name created');
						console.log('new player: '+ client.id + "====" + nickname);
				}
		});

		client.on('join lobby', () => {
				client.join('lobby');
				console.log(client.id + " joined the LOBBY");
		});

		client.on('load players', () => {
				client.emit('load players', pidToName);
				console.log(client.id + " loaded player list");
		});

		client.on('load games', () => {
				client.emit('load games', partialGames);
				console.log(client.id + " loaded game list");
		});

		client.on('create game', gamename => {
				if(gamename in partialGames || gamename in games) {
						client.emit('invalid gamename');
						console.log(client.id + " tried to use gamename " + gamename);
				} else {
						partialGames[gamename] = {
								players: [client.id,],
								playerNames: [pidToName[client.id],],
								owner: client.id,
						};
						client.emit('confirm game created', partialGames[gamename]);
						client.emit('disable join games');
						client.to('lobby').emit('load games', partialGames);

				}
		});
		client.on('delete game', gamename => {
				if(partialGames[gamename].owner == client.id) {
						var gameroom = 'gamename:' + gamename;
						io.to(gameroom).emit('force leave game');
						io.to(gameroom).emit('enable create game');
						io.of('/').in(gameroom).clients(function(error, clients) {
								if (clients.length > 0) {
										console.log('clients in the room: \n');
										console.log(clients);
										clients.forEach(function (socket_id) {
												io.sockets.sockets[socket_id].leave(gameroom);
										});
								}
						});
						delete partialGames[gamename];
						client.emit('confirm game deleted');
						client.emit('enable join games');
						client.to('lobby').emit('load games', partialGames);
				}
		});
		client.on('start game', gamename => {
				if(partialGames[gamename].owner == client.id) {
						io.of('/').in(gameroom).clients(function(error, clients) {
								if (clients.length > 0) {
										console.log('clients in the room: \n');
										console.log(clients);
										clients.forEach(function (socket_id) {
												io.sockets.sockets[socket_id].leave(gameroom);
												io.sockets.sockets[socket.id].leave('lobby');
												io.sockets.sockets[socket_id].join('ingame:'+gamename);
										});
								}
						});
						client.leave('lobby');
						client.join('ingame:'+gamename);
						io.to('ingame:'+gamename).emit('send users to game board');
						newGameState = initGameState(partialGames[gamename].players);
						games[gamename] = newGameState;
						delete partialGames[gamename];
						distributeGameState(gamename, newGameState);
				}
		});

		client.on('join game', gamename => {
				var enoughPlayers = partialGames[gamename].players.length == 4;
				if(enoughPlayers){
						client.emit('game is full');
				} else {
						var newGameInfo = partialGames[gamename];
						newGameInfo.players.push(client.id);
						newGameInfo.playerNames.push(pidToName[client.id]);
						partialGames[gamename] = newGameInfo;
						io.to(newGameInfo.owner).emit('update created game', newGameInfo);
						client.emit('confirm game joined', gamename, newGameInfo);
						client.emit('disable create game');
						client.to('gamename:'+gamename).emit('update joined game', newGameInfo);
						client.join('gamename:'+gamename);
						client.to('lobby').emit('load games', partialGames);
				}
		});
		client.on('leave game', gamename => {
				console.log('BEFORE---------------------');
				var newGameInfo = partialGames[gamename];
				console.log(partialGames[gamename]);
				newGameInfo.players.splice(newGameInfo.players.indexOf(client.id), 1);
				newGameInfo.playerNames.splice(newGameInfo.playerNames.indexOf(pidToName[client.id]), 1);
				partialGames[gamename] = newGameInfo;
				console.log(partialGames[gamename]);
				io.to(newGameInfo.owner).emit('update created game', newGameInfo);
				client.emit('confirm game left', partialGames);
				client.emit('enable create game');
				io.to('lobby').emit('load games', partialGames);
		});

		client.on('disconnect', () => {
				console.log("player disconnected: "+client.id);
		});
});

io.listen(port);
console.log('listening on port ', port);
