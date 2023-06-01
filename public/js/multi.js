const gameboard = document.querySelector('#gameContainer')
const startButton = document.querySelector('#start-button')
const turnDisplay = document.querySelector('#turn-display')
const infoDisplay = document.querySelector('#info')
const hitSound = new Audio('/images/BombHit.mp3');
const missSound = new Audio('/images/BombMiss.mp3');
const backgroundSound = new Audio('/images/Battleship.mp3');
const socket = io();
let currentPlayer = 'user'
let gameOver = false
let playerNum = null
let playerReady = false
let enemyReady = false
let userHits = []
let enemyHits = []
let winner = null
let userSunkShips = []
let enemySunkShips = []
let shot = -1;
let roomId = null
import gameBoard from '../gameObject/gameBoard.js'
import listShip from '../gameObject/listShip.js'

gameBoard.createBoard('user', gameboard)
gameBoard.createBoard('enemy', gameboard)
const userBlocks = document.querySelectorAll('#user div')
const enemyBlocks = document.querySelectorAll('#enemy div')
roomId = window.location.pathname.split('/').pop();
joinGame(roomId)

const copyButton = document.getElementById('copy-button');
copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    alert('URL copied to clipboard');
});

const popupButton = document.getElementById('popup-button');
popupButton.addEventListener('click', () => {
    var popup = window.open("", "QRCODE", "width= 300, height=300")
    popup.document.write(`<img src=https://chart.googleapis.com/chart?cht=qr&chl=${window.location.href}&chs=256x256&choe=UTF-8&chld=L|0>`)
})

function joinGame(roomId) {
    startButton.addEventListener('click', function () {
        playerReadys()
    })

    socket.emit('join-room', roomId, user._id)

    socket.on('join-room-status', (status) => { handleJoinRoom(status) })

    document.getElementById('room-code').textContent = roomId;

    socket.on('enemy-ready', (enemystatus, number) => { handleEnemyReady(enemystatus, number) })

    socket.on('player-number', (num) => {
        playerNum = parseInt(num)
    })

    socket.on('game-state', (gameState) => {
        checkGameState(gameState)
    })

    socket.on('check-player', (roomStatus) => {
        if (roomStatus) {
            if (playerNum == 1)
                socket.emit('turn-start', playerNum)
            document.getElementById('code-display').style.display = "none";
            document.querySelector('.setup-buttons').style.display = "none";
            handlePlayGameMulti()
        }
    })

    socket.on('game-started', (gameStart, player) => {
        if(gameStart){
            document.getElementById('code-display').style.display = "none";
            document.querySelector('.setup-buttons').style.display = "none";
            if (player == playerNum) {
                currentPlayer = 'user'
                turnDisplay.innerHTML = 'Your Turn'
            } else {
                currentPlayer = 'enemy'
                turnDisplay.innerHTML = 'Enemy Turn'
            }
            handlePlayGameMulti()
        }
    })

    socket.on('timerTick', (playerNum, time) => {
        document.querySelector(`.p${playerNum} .timer`).innerHTML = formatDuration(time)
        // startTimer(20, 0, 20)
    })

    socket.on('player-connection', (connections) => {
        for (let i = 0; i < 2; i++) {
            if (connections[i]) {
                document.querySelector(`.p${i + 1} .player-name`).textContent = connections[i].username;
                document.querySelector(`.p${i + 1} .img`).setAttribute('src', connections[i].image);
            } else {
                document.querySelector(`.p${i + 1} .img`).setAttribute('src', '/images/loading-gif.gif');
            }
        }
    })

    socket.on('game-winner', (number) => {
        gameOver = true
        alert(`player ${number} win`)
        setTimeout(() => {
            window.location.href = `http://` + window.location.host
        }, 1000)
    })

    function handlePlayGameMulti() {
        backgroundSound.loop = true;
        backgroundSound.volume = 0.5; 
        backgroundSound.play()
        socket.on('player-turn', (playerTurn) => {
            if (playerTurn == playerNum) {
                currentPlayer = 'user'
                turnDisplay.innerHTML = 'Your Turn'
            } else {
                currentPlayer = 'enemy'
                turnDisplay.innerHTML = 'Enemy Turn'
            }
        })

        enemyBlocks.forEach(block => block.addEventListener('click', () => {
            if (currentPlayer == 'user' && !gameOver) {
                turnDisplay.innerHTML = currentPlayer
                if (!block.classList.contains('boom') && !block.classList.contains('miss')) {
                    shot = block.getAttribute('id')
                    socket.emit('fire', shot)
                }
            }
        }))

        socket.on('fire', (id) => {
            if (userBlocks[id].classList.contains('taken')) {
                hitSound.play();
                userBlocks[id].classList.add('boom')
                infoDisplay.innerHTML = currentPlayer + ' hit'
                let classes = Array.from(userBlocks[id].classList)
                classes = classes.filter(classname => classname != 'block')
                classes = classes.filter(classname => classname != 'boom')
                classes = classes.filter(classname => classname != 'taken')
                enemyHits.push(...classes)
            } else {
                missSound.play();
                infoDisplay.innerHTML = currentPlayer + ' miss'
                userBlocks[id].classList.add('miss')
            }
            checkScore('enemy', enemyHits, enemySunkShips)
            const block = userBlocks[id]
            const data = {
                "classList" : block.classList,
                "id" : id,
                "shipHit" : enemyHits,
                "shipSunks": enemySunkShips
            }
            socket.emit('fire-reply', data)
        })

        // On Fire Reply Received
        socket.on('fire-reply', classList => {
            const enemySquare = enemyBlocks[shot]
            const obj = Object.values(classList)
            if (currentPlayer === 'user' && !gameOver) {
                if (obj.includes('taken')) {
                    hitSound.play();
                    enemySquare.classList.add('boom')
                    infoDisplay.innerHTML = currentPlayer + ' hit'
                    let classes = Array.from(obj)
                    classes = classes.filter(classname => classname != 'block')
                    classes = classes.filter(classname => classname != 'boom')
                    classes = classes.filter(classname => classname != 'taken')
                    userHits.push(...classes)
                } else {
                    missSound.play();
                    infoDisplay.innerHTML = currentPlayer + ' miss'
                    enemySquare.classList.add('miss')
                    socket.emit('turn-start', (playerNum % 2 + 1))
                }
                checkScore('user', userHits, userSunkShips)
            }
        })
        socket.on('switch-turn', (playerNum) => {
            socket.emit('turn-start', (playerNum))
        })
    }
}
function playerReadys() {
    if (gameOver || playerReady) return
    socket.emit('player-ready')
    playerReady = true
    document.querySelector(`.p${playerNum} .ready`).classList.toggle('active')
}

function formatDuration(duration) {
    let seconds = Math.floor(duration / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function handleEnemyReady(enemystatus, number) {
    enemyReady = enemystatus
    document.querySelector(`.p${number} .ready`).classList.toggle('active')
    socket.emit('check-player')
}

function handleJoinRoom(status) {
    console.log(status)
    if (!status.success) {
        alert(status.message)
        window.location.href = `http://` + window.location.host
    }
}

function checkGameState(gameState){
    if(gameState.shipPlaced.length == 0)
    {
        listShip.forEach(ship => gameBoard.randomShip(ship, 'user'))
        const shipPlaced = Array.from(userBlocks).filter(shipBlock => shipBlock.classList.contains('taken'))
        const shipData = shipPlaced.map(shipBlock => {
            return {
              id: shipBlock.id,
              listClass: Array.from(shipBlock.classList)
            };
          });     
        socket.emit('ship-placed', shipData);
    } else {
        updateGameState(gameState)
    }
}
function updateGameState(gameState){
    gameState.shipPlaced.forEach(shipBlock  => {
        for(let i = 0; i < shipBlock.listClass.length; i++){
            userBlocks[shipBlock.id].classList.add(shipBlock.listClass[i])
        }
    })
    gameState.shot.forEach(shot => {
        for(let i = 0; i < shot.listClass.length; i++){
            enemyBlocks[shot.id].classList.add(shot.listClass[i])
        }
    })
    userHits = gameState.shipHit
    userSunkShips = gameState.shipSunks
    userSunkShips.forEach(snkship => {
        let ship = document.querySelector(`.ship-display .${snkship}-ship`)
        ship.classList.add('red-x');
    })
}

function checkScore(user, userHit, userSunkShip) {
    function checkShip(shipName, shipLength) {
        if (userHit.filter(storedShipName => storedShipName == shipName).length == shipLength) {
            if (user == 'user') {
                userHits = userHit.filter(storedShipName => storedShipName != shipName)
                infoDisplay.textContent = user + ' sunk enemy ' + shipName
                let ship = document.querySelector(`.ship-display .${shipName}-ship`)
                ship.classList.add('red-x');
            }
            if (user == 'enemy') {
                enemyHits = userHit.filter(storedShipName => storedShipName != shipName)
                infoDisplay.textContent = user + ' sunk your ' + shipName
            }
            
            userSunkShip.push(shipName)
        }
    }
    checkShip(listShip[0].name, listShip[0].length)
    checkShip(listShip[1].name, listShip[1].length)
    checkShip(listShip[2].name, listShip[2].length)
    checkShip(listShip[3].name, listShip[3].length)
    checkShip(listShip[4].name, listShip[4].length)
}