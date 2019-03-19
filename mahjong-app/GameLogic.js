var winds = {
		east: '\u{1F000}',
		south: '\u{1F001}',
		west: '\u{1F002}',
		north: '\u{1F003}',
}

var dragons = {
		red: '\u{1F004}',
		green: '\u{1F005}',
		white: '\u{1F006}',
}

var seasons = {
		spring: '\u{1F026}',
		summer: '\u{1F027}',
		autumn: '\u{1F028}',
		winter: '\u{1F029}',
}

var flowers = {
		plum: '\u{1F022}',
		orchid: '\u{1F023}',
		bamboo: '\u{1F024}',
		chrys: '\u{1F025}',
}

var bamboo = ['\u{1F010}','\u{1F011}','\u{1F012}','\u{1F013}','\u{1F014}','\u{1F015}','\u{1F016}','\u{1F017}','\u{1F018}']

var characters = ['\u{1F007}','\u{1F008}','\u{1F009}','\u{1F00A}','\u{1F00B}','\u{1F00C}','\u{1F00D}','\u{1F00E}','\u{1F00F}',]

var dots = ['\u{1F019}','\u{1F01A}','\u{1F01B}','\u{1F01C}','\u{1F01D}','\u{1F01E}','\u{1F01F}','\u{1F020}','\u{1F021}',]

var pieceback = '\u{1F02B}'

var fullWall = [];
fullWall.concat(bamboo, bamboo, bamboo);
fullWall.concat(characters, characters, characters);
fullWall.concat(dots, dots, dots);
fullWall.concat(dragons, dragons, dragons);
fullWall.concat(winds, winds, winds);
fullWall.concat(seasons, flowers)

const emptyGame = {
		public: {
				round: null,
				discards: null,
				numPiecesLeft: null,
				currentTurn: null,
				admin: null,
		},
		private: {
				wall: null,
		},
}

const emptyAdmin = {
		numPlayers: 0,
		playerPids: [],
		windToPid: {},
		pidToWind: {},
		pidToOrder: {},
		orderToPid: [],
},

const emptyPersonalGame = {
		wind: null,
		hand: null,
		exposed: null,
		actions: null,
}

const emptyPieceGroup = {
		piece: null,
		type: null,
		isConcealed: null,
}

export default class GameLogic {
		shuffle(array) {
				var m = array.length, t, i;
				while (m) {
						i = Math.floor(Math.random() * m--);
						t = array[m];
						array[m] = array[i];
						array[i] = t;
				}
				return array;
		}

		arrayCollapse = array => {
				array.sort((a,b) => {return a-b;});
				if(array.length == 2) {
						return [0,1];
				} else {
						var tail = array.length - 1;
						var head = array.slice(0, tail);
						head = this.arrayCollapse(head);
						head.push(tail);
						return head;
				}
		}

		convertWindToOrder(wind) {
				switch(wind) {
						case 'east': return 0;
						case 'south': return 1;
						case 'west': return 2;
						case 'north': return 3;
				}
		}

		isFlower(card) {
				if('\u{1F022}' <= card && card <= '\u{1F025}') {
						return true;
				}
				return false;
		}

		isSeason(card) {
				if('\u{1F026}' <= card && card <= '\u{1F029}') {
						return true;
				}
				return false;
		}

		isBonus = card => {
				return this.isFlower(card) || this.isSeason(card);
		}

		initAdmin = players => {
				var admin = emptyAdmin;
				admin.playerPids = players;
				admin.numPlayers = players.length;

				var shuffledWinds = this.shuffle(['east', 'south', 'west', 'north']).slice(0,admin.numPlayers);
				var uncolOrder = shuffledWinds.map(this.convertWindToOrder);
				uncolOrder.sort();
				for(i = 0; i < admin.numPlayers; i++) {
						admin.windToPid[shuffledWinds[i]] = players[i];
						admin.pidToWind[players[i]] = shuffledWinds[i];
						admin.pidToOrder[players[i]] = uncolOrder.indexOf(this.convertWindToOrder(shuffledWinds[i]));
						admin.orderToPid[uncolOrder.indexOf(this.convertWindToOrder(shuffledWinds[i]))] = players[i]; 
				}
				return admin;
		}

		initGameState = players => {
				var game = emptyGame;

				game.public.round = this.shuffle(['east', 'south', 'west', 'north'])[0];
				game.public.discards = [];
				game.public.currentTurn = 0;
				game.public.admin = this.initAdmin(players);

				game.private.wall = this.shuffle(fullWall);

				for(i = 0; i < players.length; i++) {
						var newPersonalGame = emptyPersonalGame;
						var pid = players[i];
						newPersonalGame.wind = game.public.admin.pidToWind[pid];
						newPersonalGame.order = game.public.admin.pidToOrder[pid]
						newPersonalGame.hand = [];
						newPersonalGame.exposed = []
						var startHandSize = newPersonalGame.order == 0 ? 14 : 13;
						while(newPersonalGame.hand.length < startHandSize) {
								var newCard = game.private.wall.pop();
								if(this.isBonus(newCard)) {
										var newPieceGroup = emptyPieceGroup;
										newPieceGroup.piece = newCard;
										newPieceGroup.type = 'bonus';
										newPersonalGame.exposed.push(newPieceGroup);
								} else {
										newPersonalGame.hand.push(newCard);
								}
						}
						game[pid] = newPersonalGame;
				}

				return game;
		}

		requestInfo(pid, gameState) {
				var personalState = gameState[pid];
				var otherExposed = [];
				for(i = 0; i < gameState.numPlayers; i++) {
						otherPlayerPid = gameState.players[i];
						if(pid != otherPlayerPid) {
								otherExposed.push({
										wind: gameState.pid.wind,
										exposed: gameState.pid.exposed,
								});
						}
				}
		}
}
