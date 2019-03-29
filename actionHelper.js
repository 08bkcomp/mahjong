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

var getRelativisedPlayerIdToOrder = publicInfo => {
  var relPlayerIdToOrder = {};
  for (var playerId in relPlayerIdToOrder) {
    relPlayerIdToOrder[playerId] =
      (publicInfo.admin.playerIdToOrder[playerId] - publicInfo.currentTurn) %
      publicInfo.numPlayers;
  }
  return relPlayerIdToOrder;
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
    var relPlayerIdToOrder = getRelativisedPlayerIdToOrder(publicInfo);
    var seatPriorityA = relPlayerIdToOrder[actionA.playerId];
    var seatPriorityB = relPlayerIdToOrder[actionB.playerId];
    if (seatPriorityA < seatPriorityB) {
      return actionA;
    } else if (seatPriorityA > seatPriorityB) {
      return actionB;
    }
  }
};

module.exports = {
	actionComparator: actionComparator,
}
