const tileGroup = require('./tileHelper.js').tileGroup;

var isKong = tiles => {
  var uniqueTiles = new Set(tiles);
  if (tiles.length == 4 && uniqueTiles.size == 1) {
    return true;
  }
  return false;
};

var kongScenarioOne = (hand, newTile) => {
  hand = [...hand, newTile];
  hand.sort();
  var allFullConcealedKongs = [];
  for (var i = 0; i < hand.length; i++) {
    var possibleKong = hand.slice(i, i + 4);
    if (isKong(possibleKong)) {
      allFullConcealedKongs = [
        ...allFullConcealedKongs,
        tileGroup(possibleKong, 'kong', true),
      ];
    }
  }
  return allFullConcealedKongs;
};

var kongScenarioTwo = (hand, newTile) => {
  var matches = hand.filter(tile => tile == newTile);
  if (matches.length == 3) {
    return [tileGroup([...matches, newTile], 'kong', false)];
  }
  return [];
};

var kongScenarioThree = (exposed, newTile) => {
  for (var group of exposed) {
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
  hand.sort();
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

module.exports = {
	possibleKongs: possibleKongs,
}
