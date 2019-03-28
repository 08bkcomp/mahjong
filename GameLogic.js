import * as tileHelper from './tileHelper.js';
import {possibleKongs} from './kongHelper.js';
import {possiblePungs} from './pungHelper.js';
import {possibleChows} from './chowHelper.js';

var initEmptyGame = () => {
  return {
    publicInfo: {
      round: null,
      discards: null,
      numTilesLeft: 144,
      currentTurn: null,
      admin: null,
    },
    privateInfo: {
      wall: null,
    },
    queuedAction: null,
  };
};

var initEmptyAdmin = () => {
  return {
    numPlayers: 0,
    playerIds: [],
    windToPlayerId: {},
    playerIdToWind: {},
    playerIdToOrder: {},
    orderToPlayerId: [],
  };
};

var initEmptyPersonalGame = () => {
  return {
    wind: null,
    hand: null,
    exposed: null,
    actions: {
      draw: false,
      discard: false,
      chow: false,
      pung: false,
      kong: false,
      eye: false,
      rob: false,
      mahjong: false,
    },
  };
};

var shuffle = array => {
  var m = array.length,
    t,
    i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
};

var convertWindToOrder = wind => {
  switch (wind) {
    case 'east':
      return 0;
    case 'south':
      return 1;
    case 'west':
      return 2;
    case 'north':
      return 3;
  }
};

export var initAdmin = players => {
  var admin = initEmptyAdmin();
  admin.playerIds = players;
  admin.numPlayers = players.length;

  var shuffledWinds = shuffle(['east', 'south', 'west', 'north']).slice(
    0,
    admin.numPlayers,
  );
  var uncolOrder = shuffledWinds.map(convertWindToOrder);
  uncolOrder.sort();
  for (var i = 0; i < admin.numPlayers; i++) {
    admin.windToPlayerId[shuffledWinds[i]] = players[i];
    admin.playerIdToWind[players[i]] = shuffledWinds[i];
    admin.playerIdToOrder[players[i]] = uncolOrder.indexOf(
      convertWindToOrder(shuffledWinds[i]),
    );
    admin.orderToPlayerId[
      uncolOrder.indexOf(convertWindToOrder(shuffledWinds[i]))
    ] = players[i];
  }
  return admin;
};

export var initGameState = players => {
  var gameState = initEmptyGame();

  gameState.publicInfo.round = shuffle(['east', 'south', 'west', 'north'])[0];
  gameState.publicInfo.discards = [];
  gameState.publicInfo.currentTurn = 0;
  gameState.publicInfo.admin = initAdmin(players);

  gameState.privateInfo.wall = shuffle(tileHelper.getNewWall());
  // FOR TESTING
  //gameState.privateInfo.wall = getNewWall();

  for (var i = 0; i < players.length; i++) {
    var playerId = players[i];
    gameState[playerId] = initEmptyPersonalGame();

    gameState[playerId].wind =
      gameState.publicInfo.admin.playerIdToWind[playerId];
    gameState[playerId].order =
      gameState.publicInfo.admin.playerIdToOrder[playerId];
    gameState[playerId].hand = [];
    gameState[playerId].exposed = [];

    var startHandSize = gameState[playerId].order == 0 ? 14 : 13;
    while (gameState[playerId].hand.length < startHandSize) {
      var newTile = gameState.privateInfo.wall.pop();
      if (tileHelper.isBonus(newTile)) {
        gameState[playerId].exposed.push(
          tileHelper.tileGroup([newTile], 'bonus', false),
        );
      } else {
        gameState[playerId].hand.push(newTile);
      }
    }
    gameState[playerId].hand.sort();
    gameState[playerId].actions.discard = gameState[playerId].order == 0;
  }
  gameState.publicInfo.numTilesLeft = gameState.privateInfo.wall.length;
  return gameState;
};

var emptyActions = () => {
  return {
    draw: false,
    discard: false,
    chow: false,
    pung: false,
    kong: false,
    eye: false,
    rob: false,
    mahjong: false,
  };
};

var wipeActions = gameState => {
  for (var playerId of gameState.publicInfo.admin.playerIds) {
    gameState[playerId].actions = emptyActions();
  }
  return gameState;
};

export var drawTile = (playerId, gameState) => {
  // first check the user is allowed to draw
  if (!gameState[playerId].actions.draw) {
    return gameState;
  }
  // firstly wipe all actions, as the prev discard is now dead
  gameState = wipeActions(gameState);
  do {
    var newTile = gameState.privateInfo.wall.pop();
    if (tileHelper.isBonus(newTile)) {
      gameState[playerId].exposed.push(
        tileHelper.tileGroup([newTile], 'bonus', false),
      );
    } else {
      // now we have drawn a normal tile, need to update the possible actions
      // for the current player (everyone else has no actions)
      // note other that possible kongs and discarding, the current player
      // also cannot do anything else
      gameState[playerId].actions.discard = true;
      gameState[playerId].actions.kong = possibleKongs(
        gameState[playerId].hand,
        gameState[playerId].exposed,
        newTile,
        false,
      );
      // now we can add the tile to the hand, since actions have been recalculated
      gameState[playerId].hand = [newTile, ...gameState[playerId].hand];
    }
  } while (tileHelper.isBonus(newTile));
  gameState.publicInfo.numTilesLeft = gameState.privateInfo.wall.length;
  return gameState;
};

var updateActionsOnDiscard = (
  personalGameState,
  discardedTile,
  isNextPlayer,
) => {
  personalGameState.actions = emptyActions();
  personalGameState.actions.draw = isNextPlayer;
  personalGameState.actions.kong = possibleKongs(
    personalGameState.hand,
    personalGameState.exposed,
    discardedTile,
    true,
  );
  personalGameState.actions.pung = possiblePungs(
    personalGameState.hand,
    discardedTile,
  );
  personalGameState.actions.chow = possibleChows(
    personalGameState.hand,
    discardedTile,
  );
  personalGameState.actions.mahjong = false;
  return personalGameState;
};

var nextOrder = gameState => {
  return (
    (gameState.publicInfo.currentTurn + 1) %
    gameState.publicInfo.admin.numPlayers
  );
};

var incrementCurrentTurn = gameState => {
  gameState.publicInfo.currentTurn = nextOrder(gameState);
  return gameState;
};

export var discardTile = (playerId, gameState, tileIndex) => {
  //first check the user can discard
  if (!gameState[playerId].actions.discard) {
    return gameState;
  }
  // now wip actions (cur player can do nothing, others will be recalc)
  gameState = wipeActions(gameState);

  // and remove the tile from the discarding player's hand
  var tileToDiscard = gameState[playerId].hand[tileIndex];
  gameState[playerId].hand.splice(tileIndex, 1);

  // and resort their hand
  gameState[playerId].hand.sort();

  // and add it to list of discards
  gameState.publicInfo.discards = [
    ...gameState.publicInfo.discards,
    tileToDiscard,
  ];

  // now we move the turn counter up one
  gameState = incrementCurrentTurn(gameState);

  // now we need to update everyone elses options
  for (var otherPlayerId of gameState.publicInfo.admin.playerIds) {
    var isNextPlayer =
      gameState.publicInfo.admin.playerIdToOrder[otherPlayerId] ==
      gameState.publicInfo.currentTurn;
    if (otherPlayerId != playerId) {
      gameState[otherPlayerId] = updateActionsOnDiscard(
        gameState[otherPlayerId],
        tileToDiscard,
        isNextPlayer,
      );
    }
  }
  return gameState;
};

export var doAction = (action, gameState) => {
  var playerId = action.playerId;
  var type = action.tileGroupForAction.type;
  var setExists = false;
  for (var possTileGroup of gameState[playerId].actions[type]) {
    if (possTileGroup.tiles[0] == action.tileGroupForAction.tiles[0]) {
      setExists = true;
    }
  }
  if (setExists) {
    // if we are in here, then the action will be carried out

    gameState.queuedAction = null;
    gameState = wipeActions(gameState);
    gameState[playerId].actions.discard = true;
    gameState[playerId].exposed = [
      ...gameState[playerId].exposed,
      action.tileGroupForAction,
    ];
    // now we must remove the tiles from play. note at this stage, if the
    // action is off of a discard, the discarded tile is at the end of
    // the discards array, NOT in the action player's hand, so we must pop
    // that tile also
    var isOffDiscard = !action.tileGroupForAction.isConcealed;
    if (isOffDiscard) {
      var discardedTile = gameState.publicInfo.discards.pop();
      gameState[playerId].hand = [...gameState[playerId].hand, discardedTile];
      gameState[playerId].hand.sort();
    }
    for (var tile of action.tileGroupForAction.tiles) {
      gameState[playerId].hand.splice(
        gameState[playerId].hand.indexOf(tile),
        1,
      );
    }
  }
  return gameState;
};

export var requestExposed = (playerId, gameState) => {
  var otherExposed = {};
  for (var i = 0; i < gameState.publicInfo.admin.numPlayers; i++) {
    var otherPlayerId = gameState.publicInfo.admin.playerIds[i];
    if (playerId != otherPlayerId) {
      otherExposed[gameState[otherPlayerId].wind] =
        gameState[otherPlayerId].exposed;
    }
  }
  return otherExposed;
};
