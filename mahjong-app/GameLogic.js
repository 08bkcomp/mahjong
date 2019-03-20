var winds = {
  east: '\u{1F000}',
  south: '\u{1F001}',
  west: '\u{1F002}',
  north: '\u{1F003}',
};

var dragons = {
  red: '\u{1F004}',
  green: '\u{1F005}',
  white: '\u{1F006}',
};

var seasons = {
  spring: '\u{1F026}',
  summer: '\u{1F027}',
  autumn: '\u{1F028}',
  winter: '\u{1F029}',
};

var flowers = {
  plum: '\u{1F022}',
  orchid: '\u{1F023}',
  bamboo: '\u{1F024}',
  chrys: '\u{1F025}',
};

var bamboo = [
  '\u{1F010}',
  '\u{1F011}',
  '\u{1F012}',
  '\u{1F013}',
  '\u{1F014}',
  '\u{1F015}',
  '\u{1F016}',
  '\u{1F017}',
  '\u{1F018}',
];

var characters = [
  '\u{1F007}',
  '\u{1F008}',
  '\u{1F009}',
  '\u{1F00A}',
  '\u{1F00B}',
  '\u{1F00C}',
  '\u{1F00D}',
  '\u{1F00E}',
  '\u{1F00F}',
];

var dots = [
  '\u{1F019}',
  '\u{1F01A}',
  '\u{1F01B}',
  '\u{1F01C}',
  '\u{1F01D}',
  '\u{1F01E}',
  '\u{1F01F}',
  '\u{1F020}',
  '\u{1F021}',
];

var tileback = '\u{1F02B}';

var getNewWall = () => {
  // first add tiles for which there are four copies
  var fullWall = [...bamboo, ...characters, ...dots];
  fullWall = [...fullWall, ...Object.values(dragons)];
  fullWall = [...fullWall, ...Object.values(winds)];
  fullWall = [...fullWall, ...fullWall, ...fullWall, ...fullWall];
  // now add tiles for which there are only one each
  fullWall = [...fullWall, ...Object.values(seasons)];
  fullWall = [...fullWall, ...Object.values(flowers)];
  return fullWall;
};

var emptyGame = () => {
  return {
    publicInfo: {
      round: null,
      discards: null,
      numTilesLeft: 144,
      currentTurn: null,
      admin: null,
    },
    private: {
      wall: null,
    },
  };
};

var emptyAdmin = () => {
  return {
    numPlayers: 0,
    playerPids: [],
    windToPid: {},
    pidToWind: {},
    pidToOrder: {},
    orderToPid: [],
  };
};

var emptyPersonalGame = () => {
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

var tileGroup = (tiles, type, isConcealed) => {
  return {
    tiles: tiles,
    type: type,
    isConcealed: isConcealed,
  };
};

function shuffle(array) {
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
}

var arrayCollapse = array => {
  array.sort((a, b) => {
    return a - b;
  });
  if (array.length == 2) {
    return [0, 1];
  } else {
    var tail = array.length - 1;
    var head = array.slice(0, tail);
    head = arrayCollapse(head);
    head.push(tail);
    return head;
  }
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

var isFlower = tile => {
  if ('\u{1F022}' <= tile && tile <= '\u{1F025}') {
    return true;
  }
  return false;
};

var isSeason = tile => {
  if ('\u{1F026}' <= tile && tile <= '\u{1F029}') {
    return true;
  }
  return false;
};

var isBonus = tile => {
  return isFlower(tile) || isSeason(tile);
};

var initAdmin = players => {
  var admin = emptyAdmin();
  admin.playerPids = players;
  admin.numPlayers = players.length;

  var shuffledWinds = shuffle(['east', 'south', 'west', 'north']).slice(
    0,
    admin.numPlayers,
  );
  var uncolOrder = shuffledWinds.map(convertWindToOrder);
  uncolOrder.sort();
  for (i = 0; i < admin.numPlayers; i++) {
    admin.windToPid[shuffledWinds[i]] = players[i];
    admin.pidToWind[players[i]] = shuffledWinds[i];
    admin.pidToOrder[players[i]] = uncolOrder.indexOf(
      convertWindToOrder(shuffledWinds[i]),
    );
    admin.orderToPid[uncolOrder.indexOf(convertWindToOrder(shuffledWinds[i]))] =
      players[i];
  }
  return admin;
};

initGameState = players => {
  var game = emptyGame();

  game.publicInfo.round = shuffle(['east', 'south', 'west', 'north'])[0];
  game.publicInfo.discards = [];
  game.publicInfo.currentTurn = 0;
  game.publicInfo.admin = initAdmin(players);

  game.private.wall = shuffle(getNewWall());

  for (i = 0; i < players.length; i++) {
    var pid = players[i];
    game[pid] = emptyPersonalGame();

    game[pid].wind = game.publicInfo.admin.pidToWind[pid];
    game[pid].order = game.publicInfo.admin.pidToOrder[pid];
    game[pid].hand = [];
    game[pid].exposed = [];

    var startHandSize = game[pid].order == 0 ? 14 : 13;
    while (game[pid].hand.length < startHandSize) {
      var newTile = game.private.wall.pop();
      game.publicInfo.admin.numTilesLeft =
        game.publicInfo.admin.numTilesLeft - 1;
      if (isBonus(newTile)) {
        game[pid].exposed.push(tileGroup([newTile], 'bonus', false));
      } else {
        game[pid].hand.push(newTile);
      }
    }
    game[pid].hand.sort();
    game[pid].actions.discard = game[pid].order == 0;
  }
  return game;
};

var isKong = tiles => {
  var uniqueTiles = new Set(tiles);
  if (tiles.length == 4 && uniqueTiles.size == 1) {
    return true;
  }
  return false;
};

var kongScenarioOne = (hand, newTile) => {
  var fullHand = [...hand, newTile];
  fullHand.sort();
  var allFullConcKongs = [];
  for (i = 0; i < hand.length; i++) {
    var possKong = hand.slice(i, i + 4);
    if (isKong(possKong)) {
      allFullConcKongs = [
        ...allFullConcKongs,
        tileGroup(possKong, 'kong', true),
      ];
    }
  }
  return allFullConcKongs;
};

var kongScenarioTwo = (hand, newTile) => {
  var matches = hand.filter(tile => tile == newTile);
  if (matches.length == 3) {
    return [tileGroup([...matches, newTile], 'kong', false)];
  }
  return [];
};

var kongScenarioThree = (exposed, newTile) => {
  for (group of exposed) {
    if (group.tiles[0] == newTile && group.type == 'pung') {
      return [tileGroup([...group.tiles, newTile], 'kong', true)];
    }
  }
  return [];
};

var possibleKongs = (hand, exposed, newTile, isDiscard) => {
  // in this function, we check given a hand of concealed tiles and a new one
  // what kongs are possible. note the THREE ways one may get a kong opportunity:
  //
  // ONE: fully concealed, i.e. new tile a draw and already had three in hand
  // TWO: off a discard, i.e. tile is discard but three already in hand
  // THREE: melding, i.e. pick up the fourth tile completing an exposed pung
  //
  // in this function we will compile the results of checking all three scenarios
  // using helper functions from above for each case
  var allKongs;
  if (isDiscard) {
    allKongs = kongScenarioTwo(hand, newTile);
  } else {
    var caseOneKongs = kongScenarioOne(hand, newTile);
    var caseThreeKongs = kongScenarioThree(exposed, newTile);
    allKongs = [...caseOneKongs, ...caseThreeKongs];
  }

  if (allKongs.length > 0) {
    return allKongs;
  }
  return false;
};

var isPung = tiles => {
  var uniqueTiles = new Set(tiles);
  if (tiles.length == 3 && uniqueTiles.size == 1) {
    return true;
  }
  return false;
};

var possiblePungs = (hand, newTile) => {
  var matches = hand.filter(tile => tile == newTile);
  if (matches.length >= 2) {
    // not we cannot use [...matches, newTile] since if you already have 3
    // in hand, this would give an array of four tiles which is wrong
    return [tileGroup([newTile, newTile, newTile], 'pung', false)];
  }
  return false;
};

var findShiftedTile = (hand, compareTile, shift) => {
  var checkTile = tile => {
    return tile.codePointAt() == compareTile.codePointAt() + shift;
  };
  return hand.find(checkTile);
};

var upperChow = (hand, newTile) => {
  var upupTile = findShiftedTile(hand, newTile, 2);
  var upTile = findShiftedTile(hand, newTile, 1);
  if (upupTile && upTile) {
    return [tileGroup([newTile, upTile, upupTile], 'chow', false)];
  }
  return [];
};

var middleChow = (hand, newTile) => {
  var upTile = findShiftedTile(hand, newTile, 1);
  var downTile = findShiftedTile(hand, newTile, -1);
  if (upTile && downTile) {
    return [tileGroup([downTile, newTile, upTile], 'chow', false)];
  }
  return [];
};

var lowerChow = (hand, newTile) => {
  var downdownTile = findShiftedTile(hand, newTile, -2);
  var downTile = findShiftedTile(hand, newTile, -1);
  if (downdownTile && downTile) {
    return [tileGroup([downdownTile, downTile, newTile], 'chow', false)];
  }
  return [];
};

var possibleChows = (hand, newTile) => {
  var allChows = [
    ...upperChow(hand, newTile),
    ...middleChow(hand, newTile),
    ...lowerChow(hand, newTile),
  ];
  if (allChows.length > 0) {
    return allChows;
  }
  return false;
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
  for (pid of gameState.publicInfo.admin.playerPids) {
    gameState[pid].actions = emptyActions();
  }
  return gameState;
};

var drawTile = (pid, gameState) => {
  // first check the user is allowed to draw
  if (!gameState[pid].actions.draw) {
    return null;
  }
  // firstly wipe all actions, as the prev discard is now dead
  gameState = wipeActions(gameState);
  do {
    var newTile = gameState.private.wall.pop();
    if (isBonus(newTile)) {
      gameState[pid].exposed.push(tileGroup([newTile], 'bonus', false));
    } else {
      // now we have drawn a normal tile, need to update the possible actions
      // for the current player (everyone else has no actions)
	    // note other that possible kongs and discarding, the current player
	    // also cannot do anything else
      gameState[pid].actions.discard = true;
      gameState[pid].kong = possibleKongs(
        gameState[pid].hand,
        gameState[pid].exposed,
        newTile,
        false,
      );
      // now we can add the tile to the hand, since actions have been recalculated
      gameState[pid].hand.push(newTile);
    }
  } while (isBonus(newTile));
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

var discardTile = (pid, gameState, tileToDiscard) => {
  //first check the user can discard
  if (!gameState[pid].actions.discard) {
    return null;
  }
  // then check the tile to discard is in the hand
  if (!gameState[pid].hand.includes(tileToDiscard)) {
    return null;
  }
  // now update the actions for the discarding player
  for (action in gameState[pid].actions) {
    gameState[pid].actions[action] = false;
  }
  // and remove the tile from the discarding player's hand
  gameState[pid].hand.splice(gameState[pid].hand.indexOf(tileToDiscard), 1);
  // now we need to update everyone elses options
  var nextPlayerPid =
    gameState.publicInfo.admin.orderToPid[gameState.publicInfo.currentTurn + 1];
  for (otherPid of gameState.publicInfo.admin.playerPids) {
    if (otherPid != pid) {
      gameState[otherPid] = updateActionsOnDiscard(
        gameState[otherPid],
        tileToDiscard,
        otherPid == nextPlayerPid,
      );
    }
  }
  return gameState;
};

var emptyAction = () => {
	pid: null,
		tileGroupForAction: null,
}

var groupTypeComparator = (typeA, typeB) => {

}

var actionComparator = (actionA, actionB, publicInfo) => {
	if(actionA.tileGroupForAction.type)
}

var actionPrioritiser(requestedAction, currentActionsList) => {
	if(currentActionsList.length == 0){
		return [requestedAction,];
	}
	for (otherAction of currentActionsList) {

	}
}

var requestExposed = (pid, gameState) => {
  console.log(pid + 'called requestExposed');
  delete gameState.private.wall;
  var otherExposed = {};
  for (i = 0; i < gameState.publicInfo.admin.numPlayers; i++) {
    otherPid = gameState.publicInfo.admin.playerPids[i];
    console.log('otherPid is ' + otherPid);
    if (pid != otherPid) {
      otherExposed[gameState[otherPid].wind] = gameState[otherPid].exposed;
    } else {
      console.log('this is the same as user pid');
    }
  }
  return otherExposed;
};

module.exports = {
  initGameState: initGameState,
  requestExposed: requestExposed,
  drawTile: drawTile,
};
