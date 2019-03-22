const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const port = process.env.PORT || 5000;
const GameLogic = require('./GameLogic');
const fs = require('fs');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var ongoingGames = {};
var pidToOngoingGames = {};
var pidToName = {};
var nameToPid = {};
var partialGames = {};
var lobbyInfo = {players: pidToName, games: partialGames};
var spareGame;

var distributeGameState = gameName => {
  var roomName = 'gameName:' + gameName;
  io.of('/')
    .in(roomName)
    .clients((error, clients) => {
      if (clients.length > 0) {
        clients.forEach(function(socket_id) {
          var otherExposed = GameLogic.requestExposed(
            socket_id,
            ongoingGames[gameName],
          );
          io.sockets.sockets[socket_id].emit(
            'reload game state',
            ongoingGames[gameName].publicInfo,
            ongoingGames[gameName][socket_id],
            otherExposed,
          );
        });
      }
    });
};

var forceAction = gameName => {
  setTimeout(() => {
    var gameState = ongoingGames[gameName];
    gameState = GameLogic.doAction(gameState.queuedAction, gameState);
    ongoingGames[gameName] = gameState;
    distributeGameState(gameName);
  }, 7500);
};

io.on('connection', client => {
  //================================================
  //Recieved from user creation (home)
  //================================================
  client.on('create player', nickname => {
    if (nickname in nameToPid) {
      client.emit('name already exists');
    } else {
      pidToName[client.id] = nickname;
      nameToPid[nickname] = client.id;
      client.to('lobby').emit('load players', pidToName);
      client.emit('name created');
      console.log('new player: ' + client.id + '====' + nickname);
    }
  });
  //================================================
  //Recieved from the overall lobby
  //================================================
  client.on('join lobby', () => {
    client.join('lobby');
    console.log(client.id + ' joined the LOBBY');
  });
  //================================================
  //Recieved from the player listing area
  //================================================
  client.on('load players', () => {
    client.emit('load players', pidToName);
    console.log(client.id + ' loaded player list');
  });
  //================================================
  //Recieved from the other games listing area
  //================================================
  client.on('load games', () => {
    client.emit('load games', partialGames);
    console.log(client.id + ' loaded game list');
  });
  client.on('join game', gameName => {
    var enoughPlayers = partialGames[gameName].players.length == 4;
    if (enoughPlayers) {
      client.emit('game is full');
    } else {
      var newGameInfo = partialGames[gameName];
      newGameInfo.players.push(client.id);
      newGameInfo.playerNames.push(pidToName[client.id]);
      partialGames[gameName] = newGameInfo;
      io.to(newGameInfo.owner).emit('update created game', newGameInfo);
      client.emit('confirm game joined', gameName, newGameInfo);
      client.emit('disable create game');
      client.to('gameName:' + gameName).emit('update joined game', newGameInfo);
      client.join('gameName:' + gameName);
      client.to('lobby').emit('load games', partialGames);
    }
  });
  client.on('leave game', gameName => {
    console.log('BEFORE---------------------');
    var newGameInfo = partialGames[gameName];
    console.log(partialGames[gameName]);
    newGameInfo.players.splice(newGameInfo.players.indexOf(client.id), 1);
    newGameInfo.playerNames.splice(
      newGameInfo.playerNames.indexOf(pidToName[client.id]),
      1,
    );
    partialGames[gameName] = newGameInfo;
    console.log(partialGames[gameName]);
    io.to(newGameInfo.owner).emit('update created game', newGameInfo);
    client.emit('confirm game left', partialGames);
    client.emit('enable create game');
    io.to('lobby').emit('load games', partialGames);
  });
  //================================================
  //Recieved from create game area
  //================================================
  client.on('create game', gameName => {
    if (gameName in partialGames || gameName in ongoingGames) {
      client.emit('invalid gameName');
      console.log(client.id + ' tried to use gameName ' + gameName);
    } else {
      partialGames[gameName] = {
        players: [client.id],
        playerNames: [pidToName[client.id]],
        owner: client.id,
      };
      client.emit('confirm game created', partialGames[gameName]);
      client.emit('disable join games');
      client.to('lobby').emit('load games', partialGames);
    }
  });
  client.on('delete game', gameName => {
    if (partialGames[gameName].owner == client.id) {
      var gameroom = 'gameName:' + gameName;
      io.to(gameroom).emit('force leave game');
      io.to(gameroom).emit('enable create game');
      io.of('/')
        .in(gameroom)
        .clients(function(error, clients) {
          if (clients.length > 0) {
            console.log('clients in the room: \n');
            console.log(clients);
            clients.forEach(function(socket_id) {
              io.sockets.sockets[socket_id].leave(gameroom);
            });
          }
        });
      delete partialGames[gameName];
      client.emit('confirm game deleted');
      client.emit('enable join games');
      client.to('lobby').emit('load games', partialGames);
    }
  });
  client.on('start game', gameName => {
    if (partialGames[gameName].owner == client.id) {
      console.log('START GAME: ' + gameName);
      var roomName = 'gameName:' + gameName;
      var curPlayers = partialGames[gameName].players;
      //firstly we move people into/out of the correct rooms
      io.of('/')
        .in(roomName)
        .clients(function(error, clients) {
          if (clients.length > 0) {
            clients.forEach(function(socket_id) {
              io.sockets.sockets[socket_id].leave('lobby');
            });
          }
        });
      // also need to move client, who we note was never in the gameroom of their owned game
      client.leave('lobby');
      client.join(roomName);

      //now we tell all clients for this game to move to the game board (shows loading)
      io.to(roomName).emit('send users to game board');

      // then create a fresh game for them, init by the GameLogic
      ongoingGames[gameName] = GameLogic.initGameState(curPlayers);
      ongoingGames[gameName][`newWall`] =
        ongoingGames[gameName].privateInfo.wall;

      // then put the pid -> gameName mappings into memory
      for (pid of curPlayers) {
        pidToOngoingGames[pid] = gameName;
      }

      // then delete the partial game and tell the lobby to remove it
      delete partialGames[gameName];
      io.to('lobby').emit('load games', partialGames);

      // now we give the starting info of the game to the people in it
      distributeGameState(gameName);

      // we write inside the if statement
      fs.writeFileSync(
        '../tests/InsideIf.json',
        JSON.stringify(ongoingGames[gameName]),
      );
    }
    // we write outisde the if statement
    fs.writeFileSync(
      '../tests/OutOfIf.json',
      JSON.stringify(ongoingGames[gameName]),
    );
  });
  //=====================================================
  //Recieved from the overall game board
  //=====================================================
  client.on('discard tile', tileIndex => {
    var gameName = pidToOngoingGames[client.id];
    console.log('INSIDE SERVER: discard tile');
    console.log(
      `ongoingGames[${gameName}].privateInfo: ${Object.keys(
        ongoingGames[gameName].privateInfo,
      )}`,
    );
    console.log(
      `Keys of ongoingGames[${gameName}]: ${Object.keys(
        ongoingGames[gameName],
      )}`,
    );
    gameState = ongoingGames[gameName];
    gameState = GameLogic.discardTile(client.id, gameState, tileIndex);
    ongoingGames[gameName] = gameState;
    distributeGameState(gameName);
  });
  client.on('draw tile', () => {
    var gameName = pidToOngoingGames[client.id];
    gameState = ongoingGames[gameName];
    gameState = GameLogic.drawTile(client.id, gameState);
    ongoingGames[gameName] = gameState;
    distributeGameState(gameName);
  });
  client.on('queue action', tileGroup => {
    var action = {
      pid: client.id,
      tileGroupForAction: tileGroup,
    };
    var gameName = pidToOngoingGames[client.id];
    var gameState = ongoingGames[gameName];
    var oldAction = gameState.queuedAction;
    var actionAlreadyQueued = oldAction != null;
    if (actionAlreadyQueued) {
      gameState.queuedAction = GameLogic.actionComparator(action, oldAction);
      ongoingGames[gameName] = gameState;
    } else {
      gameState.queuedAction = action;
      forceAction(gameName);
    }
  });

  client.on('disconnect', () => {
    console.log('player disconnected: ' + client.id);
  });
});

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));
  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}
// Starts the server.
server.listen(port, function() {
  console.log('Starting server on port 5000');
});
