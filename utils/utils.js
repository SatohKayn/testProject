module.exports = {
  makeid,
  createRoom,
  findRoom,
  getPlayerNum
}

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    if ((i + 1) % 3 == 0 && (i + 1) < length)
      result += '-'
  }
  return result;
}
function createRoom(roomList, rooms, rank) {
  let roomId = makeid(9)
  roomList.set(roomId, new Set())
  var obj = {
    "roomid": roomId,
    "rank": rank,
    "connections": [null, null],
    "readys": [null, null],
    "timers": [null, null],
    "playerTimers": [600000, 600000],
    "currentPlayer": null,
    "winner": null
  }
  rooms.push(obj)
  return roomId
}

function findRoom(roomId, rooms) {
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].roomid == roomId)
      return i
  }
}

function getPlayerNum(connections) {
  for (let i = 0; i < connections.length; i++) {
    if (!connections[i]) {
      return i + 1
    }
  }
}


