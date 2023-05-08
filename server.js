const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { makeid } = require('./utils.js')
// Set static folder

let roomList = io.sockets.adapter.rooms
let rooms = []
let roomId = null

app.use(express.static(path.join(__dirname, "public")))

app.use(express.static(__dirname))


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/multi/rooms/:roomId', (req, res) => {
    roomId = req.params.roomId;
    res.sendFile(__dirname + '/public/multiPlay.html');
});

app.get('/single', (req, res) => {
    res.sendFile(__dirname + '/public/singlePlay.html');
});

app.get('/multi/createroom', (req, res) => {
    const roomId = createRoom()
    res.redirect(`/multi/rooms/${roomId}`)
});

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

function createRoom() {
    roomId = makeid(9)
    roomList.set(roomId, new Set())
    var obj = {
        "roomid": roomId,
        "connections": [false, false],
        "readys": [null, null],
        "timers": [null, null],
        "playerTimers": [600000, 600000],
        "currentPlayer": null,
        "winner": null
    }
    rooms.push(obj)
    return roomId
}

function findRoom(roomId) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].roomid == roomId)
            return i
    }
}

function getPlayerNum(connections){
    for(let i = 0; i < connections.length; i++){
        if(!connections[i]){
            return i + 1
        }
    }
}

io.on("connection", socket => {
    socket.on('join-room', (room) => {
        let status = true
        let index = findRoom(room)
        if (!roomList.has(room) || roomList.get(room).size == 2) {
            status = false
            socket.emit('join-room-status', status)
            return
        }
        socket.join(room)
        socket.number = getPlayerNum(rooms[index].connections)
        rooms[index].connections[socket.number - 1] = true
        io.to(roomId).emit('player-connection', rooms[index].connections)
        socket.emit('player-number', socket.number)
    })

    socket.on('player-ready', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId)
        rooms[index].readys[socket.number - 1] = true
        let enemyReady = true
        socket.to(roomId).emit('enemy-ready', enemyReady, socket.number)
    })

    socket.on('disconnecting', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId)
        if(rooms[index] != null){
            rooms[index].connections[socket.number - 1] = false 
            io.to(roomId).emit('player-connection', rooms[index].connections)
        }      
    })

    socket.on('check-player', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId)
        let roomStatus = false
        var a = [true, true]
        if (JSON.stringify(rooms[index].readys) == JSON.stringify(a)) {
            roomStatus = true
            io.to(roomId).emit('check-player', (roomStatus))
        }
    })

    socket.on('turn-start', (playerNum) => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId)
        rooms[index].currentPlayer = playerNum
        io.to(roomId).emit('player-turn', (rooms[index].currentPlayer))
        clearInterval(rooms[index].timers[rooms[index].currentPlayer % 2])
        rooms[index].timers[playerNum - 1] = setInterval(() => {
            rooms[index].playerTimers[playerNum - 1] -= 1000
            io.to(roomId).emit('timerTick', playerNum, rooms[index].playerTimers[playerNum - 1]);
            if (rooms[index].playerTimers[playerNum - 1] == 0)
                io.to(roomId).emit('game-winner', (playerNum % 2))
        }, 1000);
    })

    socket.on('fire', (shot) => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        socket.to(roomId).emit('fire', shot)
    })

    socket.on('fire-reply', classList => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        socket.to(roomId).emit('fire-reply', classList)
    })

    socket.on('game-winner', (winner) => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        io.to(roomId).emit('game-winner', winner)
    })
})