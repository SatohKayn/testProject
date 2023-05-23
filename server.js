require('dotenv').config()

const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { createRoom, findRoom, getPlayerNum, getRankRoom, pointCalculate } = require('./utils/utils.js')
const mongoose = require('mongoose')
const cookieParser = require("cookie-parser")
const { validateToken } = require("./utils/auth.js");
const authRoute = require('./routes/authRoute.js')
const userRoute = require('./routes/userRoute.js')
const Player = require('./models/playerModel.js')
let roomList = io.sockets.adapter.rooms
let rooms = []
let roomId = null

app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, "public")))

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

mongoose
    .connect(process.env.DATABASE_URL).then(() => {
        console.log('connected')
    }).catch((error) => {
        console.log(error)
    })

app.use('/user', authRoute)

app.get('/register', (req, res) => {
    res.render('home/register');
});

app.get('/login', (req, res) => {
    res.render('home/login');
});

app.get('/', validateToken, async (req, res) => {
    try {
        const user = await Player.findById(req.id);
        res.render('home/index', { user: user });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
});

app.use('/users', validateToken, userRoute)

app.post('/logout', (req, res) => {
    res.clearCookie('access-token', { expires: new Date(0) });
    res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/multi/rooms/:roomId', validateToken, async (req, res) => {
    roomId = req.params.roomId;
    const user = await Player.findById(req.id);
    res.render('game/multiPlay', { user: user })
});

app.get('/single', (req, res) => {
    res.render('game/singlePlay')
});

app.get('/rank', validateToken, async (req, res) => {
    const user = await Player.findById(req.id);
    roomId = await getRankRoom(rooms, req.id, roomList)
    if (!roomId)
        roomId = createRoom(roomList, rooms, true)
    res.render('game/rank', { user: user, room: roomId })
});

app.get('/multi/createroom', validateToken, (req, res) => {
    const roomId = createRoom(roomList, rooms, false)
    res.redirect(`/multi/rooms/${roomId}`)
});

io.on("connection", (socket) => {
    socket.on('join-room', async (room, userId) => {
        let status = {}
        let index = findRoom(room, rooms)
        if (!roomList.has(room) ) {
            status = { success: false, message: 'Room not found' }
            socket.emit('join-room-status', status)
            return
        }
        if(roomList.get(room).size == 2){
            status = { success: false, message: 'Room full' }
            socket.emit('join-room-status', status)
            return
        }
        // if(rooms[index].usersIP.includes(userIP)){
        //     status = { success: false, message: 'You cant join your own room' }
        //     socket.emit('join-room-status', status)
        //     return
        // }
        socket.join(room)
        socket.number = getPlayerNum(rooms[index].connections)
        // rooms[index].usersIP[socket.number - 1] = userIP
        rooms[index].connections[socket.number - 1] = await Player.findById(userId)
        io.to(roomId).emit('player-connection', rooms[index].connections)
        socket.emit('player-number', socket.number)
        socket.emit('game-state', rooms[index].gameState[socket.number - 1])
        if(rooms[index].gameStart){      
            socket.emit('game-started', rooms[index].gameStart, rooms[index].currentPlayer)
        }           
    })

    socket.on('player-ready', () => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
        rooms[index].readys[socket.number - 1] = true
        let enemyReady = true
        socket.to(roomId).emit('enemy-ready', enemyReady, socket.number)
        
    })

    socket.on('ship-placed', shipPlaced => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
        rooms[index].gameState[socket.number - 1].shipPlaced = shipPlaced
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
            rooms[index].gameStart = true
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
                io.to(roomId).emit('game-winner', (playerNum % 2 + 1))
        }, 1000);
    })

    socket.on('fire', (shot) => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
        const find = rooms[index].gameState[socket.number % 2].shipPlaced.find(obj => obj.id == shot)
        if(find){
            rooms[index].gameState[socket.number - 1].shot.push({
                id: shot,
                listClass: ['boom']
            })
        } else {
            rooms[index].gameState[socket.number - 1].shot.push({
                id: shot,
                listClass: ['miss']
            })
        }
        socket.to(roomId).emit('fire', shot)
    })

    socket.on('fire-reply', data => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
        const find = rooms[index].gameState[socket.number - 1].shipPlaced.find(obj => obj.id == data.id)
        if(find){         
            find.listClass = Array.from(Object.values(data.classList))
            rooms[index].gameState[socket.number % 2].points = parseInt(rooms[index].gameState[socket.number % 2].points, 10) + 1
            rooms[index].gameState[socket.number % 2].shipHit = data.shipHit
            rooms[index].gameState[socket.number % 2].shipSunks = data.shipSunks
        } else {
            rooms[index].gameState[socket.number - 1].shipPlaced.push({
                id: data.id,
                listClass: ['miss']
            })
        }
        socket.to(roomId).emit('fire-reply', data.classList)
        if(rooms[index].gameState[socket.number % 2].points == 17){
            io.to(roomId).emit('game-winner', (socket.number % 2))
        }
    })

    socket.on('game-winner', async (winner) => {
        let roomId = Array.from(socket.rooms).find(roomId => roomId !== socket.id)
        let index = findRoom(roomId, rooms)
        if (rooms[index].rank) {
            for(let i = 0; i<2; i++){
                const user1 = await Player.findById(rooms[index].connections[i])
                const user2 = await Player.findById(rooms[index].connections[(i+1) % 2 ])
                console.log(winner)
                if(i + 1 == winner){                    
                    let newPoint =  pointCalculate(user1, user2, 1)
                    user1.wins++;
                    user1.point += newPoint;
                    await user1.save()
                }else {
                    let newPoint =  pointCalculate(user1, user2, 0)
                    user1.loses++;
                    user1.point += newPoint;
                    await user1.save()
                }
            }
        }
        io.to(roomId).emit('game-winner', winner)
    })
})