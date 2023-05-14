require('dotenv').config()

const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { createRoom, findRoom, getPlayerNum } = require('./utils/utils.js')
const mongoose = require('mongoose')
const { error } = require('console')
const cookieParser = require("cookie-parser")
const { validateToken } = require("./utils/JWT");
const authRoute = require('./app/routes/authRoute.js')
const Player = require('./app/models/playerModel.js')
const { sign, verify } = require("jsonwebtoken");
const multer = require('multer');
const upload = multer({
    dest: path.join(__dirname, 'public/images/')
});
let roomList = io.sockets.adapter.rooms
let rooms = []
let roomId = null

app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/app/views'));
app.use(express.static(path.join(__dirname, "public")))

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

mongoose
    .connect(process.env.DATABASE_URL).then(() => {
        console.log('connected')
    }).catch(() => {
        console.log(error)
    })

app.use('/user', authRoute)

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/',validateToken,  async (req, res) => {
    try {
        const user = await Player.findById(req.id);
        res.render('index', { user: user });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

app.get('/users/:id', validateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Player.findById(id);
        res.render('profile', { user: user });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.post('/profile/update-image', validateToken, upload.single('profileImage'), async (req, res) => {
    const file = req.file;
    try {
        const user = await Player.findById(req.id);
        user.image = `/images/${file.filename}`
        await user.save();
        res.redirect(`users/${user.id}`)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.post('/logout', (req, res) => {
    res.clearCookie('access-token', { expires: new Date(0) });
    res.json({success:true, message: 'Logged out successfully.' });
  });

app.get('/multi/rooms/:roomId', validateToken, async (req, res) => {
    roomId = req.params.roomId;
    const user = await Player.findById(req.id);
    res.render('multiPlay', { user: user })
});

app.get('/single', (req, res) => {
    res.render('singlePlay')
});

app.get('/rank', (req, res) => {
    // rooms.forEach(room => {
    //     if(room.rank)
    // })
    res.render('singlePlay')
});

app.get('/multi/createroom', validateToken, (req, res) => {
    const roomId = createRoom(roomList, rooms, false)
    res.redirect(`/multi/rooms/${roomId}`)
});

io.on("connection", socket => {
    socket.on('join-room', (room) => {
        let status = true
        let index = findRoom(room, rooms)
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
        let index = findRoom(roomId, rooms)
        rooms[index].readys[socket.number - 1] = true
        let enemyReady = true
        socket.to(roomId).emit('enemy-ready', enemyReady, socket.number)
    })

    socket.on('disconnecting', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
        if (rooms[index] != null) {
            rooms[index].connections[socket.number - 1] = null
            io.to(roomId).emit('player-connection', rooms[index].connections)
        }
    })

    socket.on('check-player', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
        let roomStatus = false
        var a = [true, true]
        if (JSON.stringify(rooms[index].readys) == JSON.stringify(a)) {
            roomStatus = true
            io.to(roomId).emit('check-player', (roomStatus))
        }
    })

    socket.on('turn-start', (playerNum) => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
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