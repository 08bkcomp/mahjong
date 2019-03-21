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
  return [
    ...bamboo,
    ...bamboo,
    ...bamboo,
    ...bamboo,
    ...characters,
    ...characters,
    ...characters,
    ...characters,
    ...dots,
    ...dots,
    ...dots,
    ...dots,
    ...Object.values(dragons),
    ...Object.values(dragons),
    ...Object.values(dragons),
    ...Object.values(dragons),
    ...Object.values(winds),
    ...Object.values(winds),
    ...Object.values(winds),
    ...Object.values(winds),
    ...Object.values(seasons),
    ...Object.values(flowers),
  ];
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
    privateInfo: {
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
  var gameState = emptyGame();

  gameState.publicInfo.round = shuffle(['east', 'south', 'west', 'north'])[0];
  gameState.publicInfo.discards = [];
  gameState.publicInfo.currentTurn = 0;
  gameState.publicInfo.admin = initAdmin(players);

  gameState.privateInfo.wall = shuffle(getNewWall());

  for (i = 0; i < players.length; i++) {
    var pid = players[i];
    gameState[pid] = emptyPersonalGame();

    gameState[pid].wind = gameState.publicInfo.admin.pidToWind[pid];
    gameState[pid].order = gameState.publicInfo.admin.pidToOrder[pid];
    gameState[pid].hand = [];
    gameState[pid].exposed = [];

    var startHandSize = gameState[pid].order == 0 ? 14 : 13;
    while (gameState[pid].hand.length < startHandSize) {
      var newTile = gameState.privateInfo.wall.pop();
      if (isBonus(newTile)) {
        gameState[pid].exposed.push(tileGroup([newTile], 'bonus', false));
      } else {
        gameState[pid].hand.push(newTile);
      }
    }
    gameState[pid].hand.sort();
    gameState[pid].actions.discard = gameState[pid].order == 0;
  }
  gameState.publicInfo.numTilesLeft = gameState.privateInfo.wall.length;
  return gameState;
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
    return gameState;
  }
  // firstly wipe all actions, as the prev discard is now dead
  gameState = wipeActions(gameState);
  do {
    var newTile = gameState.privateInfo.wall.pop();
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
      gameState[pid].hand = [newTile, ...gameState[pid].hand];
    }
  } while (isBonus(newTile));
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
    (gameState.publicInfo.currentTurn + 1) % gameState.publicInfo.admin.numPlayers
  );
};

var incrementCurrentTurn = gameState => {
  console.log(`prev curTurn: ${gameState.publicInfo.currentTurn}`);
  gameState.publicInfo.currentTurn = nextOrder(gameState);
  console.log(`new curTurn: ${gameState.publicInfo.currentTurn}`);
  return gameState;
};

var discardTile = (pid, gameState, tileIndex) => {
  //first check the user can discard
  if (!gameState[pid].actions.discard) {
    return gameState;
  }
  // now wip actions (cur player can do nothing, others will be recalc)
  gameState = wipeActions(gameState);

	// and resort their hand
	gameState[pid].hand.sort();

  // and remove the tile from the discarding player's hand
  var tileToDiscard = gameState[pid].hand[tileIndex];
  gameState[pid].hand.splice(tileIndex, 1);

  // and add it to list of discards
  gameState.publicInfo.discards = [
    ...gameState.publicInfo.discards,
    tileToDiscard,
  ];

  // now we move the turn counter up one
  gameState = incrementCurrentTurn(gameState);

  // now we need to update everyone elses options
  for (otherPid of gameState.publicInfo.admin.playerPids) {
    var isNextPlayer =
      gameState.publicInfo.admin.pidToOrder[otherPid] ==
      gameState.publicInfo.currentTurn;
    if (otherPid != pid) {
      gameState[otherPid] = updateActionsOnDiscard(
        gameState[otherPid],
        tileToDiscard,
        isNextPlayer,
      );
    }
  }
  return gameState;
};

var emptyAction = () => {
  return {
    pid: null,
    tileGroupForAction: null,
  };
};

var typeToPriority = type => {
  switch (type) {
    case 'win':
      return 0;
    case 'pung':
      return 1;
    case 'kong':
      return 1;
    case 'chow':
      return 0;
  }
};

var getRelativisedPidToOrder = publicInfo => {
  var relPidToOrder = {};
  for (pid in relPidToOrder) {
    relPidToOrder[pid] =
      (publicInfo.admin.pidToOrder[pid] - publicInfo.currentTurn) %
      publicInfo.numPlayers;
  }
  return relPidToOrder;
};

var actionComparator = (actionA, actionB, publicInfo) => {
  var typeA = actionA.tileGroupForAction.type;
  var typeB = actionB.tileGroupForAction.type;
  var typePriorityA = typeToPriority(typeA);
  var typePriorityB = typeToPriority(typeB);
  if (typePriorityA < typePriorityB) {
    return actionA;
  } else if (typePriorityA > typePriorityB) {
    return actionB;
  } else {
    var relPidToOrder = getRelativisedPidToOrder(publicInfo);
    var seatPriorityA = relPidToOrder[actionA.pid];
    var seatPriorityB = relPidToOrder[actionB.pid];
    if (seatPriorityA < seatPriorityB) {
      return actionA;
    } else if (seatPriorityA > seatPriorityB) {
      return actionB;
    }
  }
};

var doAction = (action, gameState) => {
  var pid = action.pid;
  var type = action.tileGroupForAction.type;
  var setExists = false;
  for (possTileGroup of gameState[pid].actions[type]) {
    if (possTileGroup.tiles[0] == action.tileGroupForAction.tiles[0]) {
      setExists = true;
    }
  }
  if (setExists) {
    gameState = wipeActions(gameState);
    gameState[pid].actions.discard = true;
    gameState[pid].exposed = [
      ...gameState[pid].exposed,
      action.tileGroupForAction,
    ];
    // now we must remove the tiles from play. note at this stage, if the
    // action is off of a discard, the discarded tile is at the end of
    // the discards array, NOT in the action player's hand, so we must pop
    // that tile also
    var isOffDiscard = !action.tileGroupForAction.isConcealed;
    if (isOffDiscard) {
      gameState.publicInfo.discards.pop();
    }
    for (tile of action.tileGroupForAction.tiles) {
      gameState[pid].hand.splice(gameState[pid].hand.indexOf(tile), 1);
    }
  }
  return gameState;
};

var requestExposed = (pid, gameState) => {
  var otherExposed = {};
  for (i = 0; i < gameState.publicInfo.admin.numPlayers; i++) {
    otherPid = gameState.publicInfo.admin.playerPids[i];
    if (pid != otherPid) {
      otherExposed[gameState[otherPid].wind] = gameState[otherPid].exposed;
    } else {
    }
  }
  return otherExposed;
};

module.exports = {
  initGameState: initGameState,
  requestExposed: requestExposed,
  drawTile: drawTile,
  discardTile: discardTile,
  doAction: doAction,
  actionComparator: actionComparator,
};
