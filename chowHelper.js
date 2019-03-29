const tileGroup = require('./tileHelper.js').tileGroup;

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

module.exports = {
	possibleChows: possibleChows,
}
