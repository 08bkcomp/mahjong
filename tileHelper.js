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

export var getNewWall = () => {
  // NB the wall returned from this is NOT SHUFFLED
  // first add tiles for which there are four copies
  var wall = [
    ...bamboo,
    ...dots,
    ...characters,
    ...Object.values(dragons),
    ...Object.values(winds),
  ];
  // then duplicate
  wall = [...wall, ...wall, ...wall, ...wall];
  // then add bonus tiles
  wall = [...wall, ...Object.values(seasons), ...Object.values(flowers)];
  return wall;
};

var getCheckSuitFn = suit => {
  return tile => Object.values(suit).includes(tile);
};

var isFlower = getCheckSuitFn(flowers);
var isSeason = getCheckSuitFn(seasons);

var nonHonourSuitCheckers = [
  getCheckSuitFn(dots),
  getCheckSuitFn(characters),
  getCheckSuitFn(bamboo),
];

export var isBonus = tile => {
  return isFlower(tile) || isSeason(tile);
};

var checkAllOneSuit = (tiles, isSuit) => {
  return tiles.reduce(
    (accumulator, currentTile) => accumulator && isSuit(currentTile),
  );
};

export var checkAllSameNonHonourSuit = tiles => {
  var isAllSameSuit = false;
  for (var isSuit of nonHonourSuitCheckers) {
    isAllSameSuit = isAllSameSuit || checkAllOneSuit(tiles, isSuit);
  }
  return isAllSameSuit;
};

export var tileGroup = (tiles, type, isConcealed) => {
  return {
    tiles: tiles,
    type: type,
    isConcealed: isConcealed,
  };
};

// module.exports = {
//   getNewWall: getNewWall,
//   isBonus: isBonus,
//   checkAllSameNonHonourSuit: checkAllSameNonHonourSuit,
// };
