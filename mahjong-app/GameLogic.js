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

var pieceback = '\u{1F02B}';

var getNewWall = () => {
  var fullWall = [];
  fullWall = fullWall.concat(bamboo);
  fullWall = fullWall.concat(characters);
  fullWall = fullWall.concat(dots);
  fullWall = fullWall.concat(Object.values(dragons));
  fullWall = fullWall.concat(Object.values(winds));
  fullWall = fullWall.concat(fullWall, fullWall);
  fullWall = fullWall.concat(Object.values(seasons));
  fullWall = fullWall.concat(Object.values(flowers));
  console.log(fullWall);
  return fullWall;
};

var emptyGame = () => {
  return {
    publicInfo: {
      round: null,
      discards: null,
      numPiecesLeft: 144,
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
      chow: false,
      pung: false,
      kong: false,
      eye: false,
      rob: false,
      mahjong: false,
    },
  };
};

const pieceGroup = (pieces, type, isConcealed) => {
  return {
    pieces: pieces,
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

var isFlower = card => {
  if ('\u{1F022}' <= card && card <= '\u{1F025}') {
    return true;
  }
  return false;
};

var isSeason = card => {
  if ('\u{1F026}' <= card && card <= '\u{1F029}') {
    return true;
  }
  return false;
};

var isBonus = card => {
  return isFlower(card) || isSeason(card);
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
      var newCard = game.private.wall.pop();
      game.publicInfo.admin.numPiecesLeft =
        game.publicInfo.admin.numPiecesLeft - 1;
      if (isBonus(newCard)) {
        game[pid].exposed.push(pieceGroup([newCard], 'bonus', false));
      } else {
        game[pid].hand.push(newCard);
      }
    }
    game[pid].hand.sort();
  }
  return game;
};

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
};
