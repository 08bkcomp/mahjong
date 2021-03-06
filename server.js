/*eslint no-console: ["error", { allow: ["log"] }] */
const gameLogic = require('./GameLogic.js');
const actionComparator = require('./actionHelper').actionComparator;

const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const port = process.env.PORT || 5000;

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var ongoingGames = {};
var playerIdToOngoingGames = {};
var playerIdToUsername = {};
var usernameToPlayerId = {};
var partialGames = {};

var distributeGameState = gameName => {
  var roomName = 'gameName:' + gameName;
  io.of('/')
    .in(roomName)
    .clients((error, clients) => {
      if (clients.length > 0) {
        clients.forEach(function(socket_id) {
          var otherExposed = gameLogic.requestExposed(
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
    gameState = gameLogic.doAction(gameState.queuedAction, gameState);
    ongoingGames[gameName] = gameState;
    distributeGameState(gameName);
  }, 7500);
};

var isRegistered = playerId => {
  return playerId in playerIdToUsername;
};

var deleteGame = (playerId, gameName) => {
  if (partialGames[gameName].owner == playerId) {
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
    io.to('lobby').emit('load games', partialGames);
  }
};

var leaveGame = (playerId, gameName) => {
  if (partialGames[gameName].playerIds.includes(playerId)) {
    var newGameInfo = partialGames[gameName];
    newGameInfo.playerIds.splice(newGameInfo.playerIds.indexOf(playerId), 1);
    newGameInfo.playerUsernames.splice(
      newGameInfo.playerUsernames.indexOf(playerIdToUsername[playerId]),
      1,
    );
    partialGames[gameName] = newGameInfo;
    io.to(newGameInfo.owner).emit('update created game', newGameInfo);
    io.to('lobby').emit('load games', partialGames);
  }
};

io.on('connection', client => {
  //================================================
  //Recieved from user creation (splash)
  //================================================
  client.on('check username', username => {
    if (username in usernameToPlayerId) {
      client.emit('username already exists');
    }
  });
  client.on('create player', username => {
    if (username in usernameToPlayerId) {
      client.emit('username already exists');
    } else {
      playerIdToUsername[client.id] = username;
      usernameToPlayerId[username] = client.id;
      client.to('lobby').emit('load players', playerIdToUsername);
      client.join('lobby');
      client.emit('username created');
      console.log('new player: ' + client.id + '====' + username);
    }
  });
  //================================================
  //Recieved from the overall lobby
  //================================================
  client.on('check registration', () => {
    if (!isRegistered(client.id)) {
      client.emit('unregistered user');
    }
  });
  //================================================
  //Recieved from the player listing area
  //================================================
  client.on('load players', () => {
    client.emit('load players', playerIdToUsername);
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
    var enoughPlayers = partialGames[gameName].playerIds.length == 4;
    if (enoughPlayers) {
      client.emit('game is full');
    } else {
      var newGameInfo = partialGames[gameName];
      newGameInfo.playerIds.push(client.id);
      newGameInfo.playerUsernames.push(playerIdToUsername[client.id]);
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
    leaveGame(client.id, gameName);
    client.emit('confirm game left', partialGames);
    client.emit('enable create game');
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
        playerIds: [client.id],
        playerUsernames: [playerIdToUsername[client.id]],
        owner: client.id,
      };
      client.emit('confirm game created', partialGames[gameName]);
      client.emit('disable join games');
      client.to('lobby').emit('load games', partialGames);
    }
  });
  client.on('delete game', gameName => {
    deleteGame(client.id, gameName);
    client.emit('confirm game deleted');
    client.emit('enable join games');
    client.to('lobby').emit('load games', partialGames);
  });
  client.on('start game', gameName => {
    if (partialGames[gameName].owner == client.id) {
      console.log('START GAME: ' + gameName);
      var roomName = 'gameName:' + gameName;
      var curPlayers = partialGames[gameName].playerIds;
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

      // then create a fresh game for them, init by the gameLogic
      ongoingGames[gameName] = gameLogic.initGameState(curPlayers);
      ongoingGames[gameName][`newWall`] =
        ongoingGames[gameName].privateInfo.wall;

      // then put the playerId -> gameName mappings into memory
      for (var playerId of curPlayers) {
        playerIdToOngoingGames[playerId] = gameName;
      }

      // then delete the partial game and tell the lobby to remove it
      delete partialGames[gameName];
      io.to('lobby').emit('load games', partialGames);

      // now we give the starting info of the game to the people in it
      distributeGameState(gameName);
    }
  });
  //=====================================================
  //Recieved from the overall game board
  //=====================================================
  client.on('discard tile', tileIndex => {
    var gameName = playerIdToOngoingGames[client.id];
    var gameState = ongoingGames[gameName];
    gameState = gameLogic.discardTile(client.id, gameState, tileIndex);
    ongoingGames[gameName] = gameState;
    distributeGameState(gameName);
  });
  client.on('draw tile', () => {
    var gameName = playerIdToOngoingGames[client.id];
    var gameState = ongoingGames[gameName];
    gameState = gameLogic.drawTile(client.id, gameState);
    ongoingGames[gameName] = gameState;
    distributeGameState(gameName);
  });
  client.on('queue action', tileGroup => {
    var action = {
      playerId: client.id,
      tileGroupForAction: tileGroup,
    };
    var gameName = playerIdToOngoingGames[client.id];
    var gameState = ongoingGames[gameName];
    var oldAction = gameState.queuedAction;
    var actionAlreadyQueued = oldAction != null;
    if (actionAlreadyQueued) {
      gameState.queuedAction = actionComparator(action, oldAction);
      ongoingGames[gameName] = gameState;
    } else {
      gameState.queuedAction = action;
      forceAction(gameName);
    }
  });
  //=====================================================
  //Recieved to do clean up ops
  //=====================================================
  client.on('cleanup created game', gameName => {
    deleteGame(client.id, gameName);
  });

  client.on('cleanup joined game', gameName => {
    leaveGame(client.id, gameName);
  });

  client.on('cleanup ongoing game', () => {});

  client.on('disconnect', () => {
    console.log('player disconnected: ' + client.id);
    // CLEANUP -----------------------
    // First we need to check what has happened
    if (isRegistered(client.id)) {
      for (var gameName in partialGames) {
        // remove them from any partial games they are in
        leaveGame(client.id, gameName);
        // delete any of their partial games which they own
        deleteGame(client.id, gameName);
      }
      // deregister
      console.log(playerIdToUsername);
      delete usernameToPlayerId[playerIdToUsername[client.id]];
      delete playerIdToUsername[client.id];
      console.log(playerIdToUsername);
    }
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
  console.log(`Starting server on port ${port}`);
});
