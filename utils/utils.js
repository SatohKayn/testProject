module.exports = {
  makeid,
  createRoom,
  findRoom,
  getPlayerNum,
  getRankRoom,
  pointCalculate
}
const Player = require('../models/playerModel');
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
    "connections": [null, null],
    "readys": [null, null],
    "timers": [null, null],
    "rank": rank,
    "playerTimers": [600000, 600000],
    "currentPlayer": 1,
    "gameStart": false,
    "gameState": [{
      "shipPlaced": [],
      "shot": [],
      "shipSunks": [],
      "shipHit": [],
      "points": 0,
    }, {
      "shipPlaced": [],
      "shot": [],
      "shipSunks": [],
      "shipHit": [],
      "points": 0,
    }],
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

async function getRankRoom(rooms, id, roomList) {
  const user1 = await Player.findById(id);

  for (const room of rooms) {
    if (room.rank) {
      for (const connection of room.connections) {
        if (connection) {
          const user2 = await Player.findById(connection);
          if (
            Math.abs(user2.point - user1.point) <= 199 &&
            roomList.get(room.roomid).size < 2 && !room.connections.find(obj => obj && obj._id && obj._id.toString() === id)
          ) {
            return room.roomid;
          }
        }
      }
    }
  }
  return null;
}

function pointCalculate(user1, user2, actualScore) {
  const expectedScore = 1 / (1 + Math.pow(10, (user2.point - user1.point) / 400));
  const ratingChange = 32 * (actualScore - expectedScore);
  return Math.floor(ratingChange);
}
