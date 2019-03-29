const tileGroup = require('./tileHelper.js').tileGroup;

var possiblePungs = (hand, newTile) => {
  var matches = hand.filter(tile => tile == newTile);
  if (matches.length >= 2) {
    // not we cannot use [...matches, newTile] since if you already have 3
    // in hand, this would give an array of four tiles which is wrong
    return [tileGroup([newTile, newTile, newTile], 'pung', false)];
  }
  return false;
};

module.exports = {
	possiblePungs: possiblePungs,
}
