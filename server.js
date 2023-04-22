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
<<<<<<< HEAD
let roomList = io.sockets.adapter.rooms
let rooms = []
let roomId = null

app.use(express.static(path.join(__dirname, "public")))
=======
app.use(express.static(__dirname))
>>>>>>> e76616bd3182667bc94f0400bdd78cab16fadd93

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

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

io.on("connection", socket => {
    socket.on('create-room', () => {
        roomId = makeid(9)
        roomList.set(roomId, new Set())
        var obj = {
            "roomid" : roomId,
            "connections" : [null, null],
            "readys": [null, null],
            "winner": null
        }
        rooms.push(obj)
        socket.emit('getRoomId', roomId)
    })
    
    socket.on('join-room', (room) => {
        let status = true
        if (!roomList.has(room) || roomList.get(room).size == 2) {
            status = false
            socket.emit('join-room-status', status)
            return
        }
        socket.join(room)
        if (roomList.get(room).size == 1) {
            socket.number = 1
        } else socket.number = 2
        socket.emit('player-number', socket.number)
    })

    socket.on('player-ready', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        rooms.forEach(room => {
            if(room.roomid == roomId)
                room.readys[socket.number - 1] = true 
        })
        let enemyReady = true
        let msg = 'player ' + socket.number + ' ready'
        
        socket.to(roomId).emit('enemy-ready', enemyReady, msg)
    })

    socket.on('disconnect', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        socket.to(roomId).emit('player-connection', socket.number)
      })

    socket.on('check-player', () => {
        let roomStatus = false
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        var a = [true, true]
        rooms.forEach(room => {
            if(room.roomid == roomId && JSON.stringify(room.readys) == JSON.stringify(a))
                roomStatus = true
        })
        io.to(roomId).emit('check-player', (roomStatus))
    })
    

    // socket.on('player-turn', () => {
    //     let playerTurn = 1
    //     if (socket.mum == 2)
    //         playerTurn = 2
    //     socket.emit('player-number', playerTurn)
    // })

    socket.on('fire', (shot) => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        console.log(shot + ' from ' + socket.number)
        socket.to(roomId).emit('fire', shot)
    })

    socket.on('fire-reply', classList => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        const values = Object.values(classList)
        console.log(values)
        socket.to(roomId).emit('fire-reply', classList)
    })

    
})