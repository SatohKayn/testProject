const gameboard = document.querySelector('#gameContainer')
const optionContainer = document.querySelector('.ship-display')
const rotateButton = document.querySelector('#rotate-button')
const startButton = document.querySelector('#start-button')
const turnDisplay = document.querySelector('#turn-display')
const infoDisplay = document.querySelector('#info')
const hitSound = new Audio('/images/BombHit.mp3');
const missSound = new Audio('/images/BombMiss.mp3');
const backgroundSound = new Audio('/images/Battleship.mp3');
const socket = io();
let angle = 0
let currentPlayer = 'user'
let gameOver = false
let playerNum = null
let userHits = []
let enemyHits = []
let playerReady = false
let enemyReady = false
let winner = null
const userSunkShips = []
const enemySunkShips = []
let shot = -1;
let roomId = null
import gameBoard from '../gameObject/gameBoard.js'
import listShip from '../gameObject/listShip.js'
joinGame(room)
function joinGame(roomId) {
    startButton.addEventListener('click', function () {
        playerReadys()
    })

    socket.emit('join-room', roomId, user._id)

    socket.on('join-room-status', (status) => { handleJoinRoom(status) })

    socket.on('enemy-ready', (enemystatus, msg) => { handleEnemyReady(enemystatus, msg) })

    socket.on('player-number', (num) => {
        playerNum = parseInt(num)
    })

    socket.on('check-player', (roomStatus) => {
        if (roomStatus) {
            if (playerNum == 1)
                socket.emit('turn-start', playerNum)
            handlePlayGameMulti()
        }
    })

    socket.on('timerTick', (playerNum, time) => {
        document.querySelector(`.p${playerNum} .timer`).innerHTML = formatDuration(time)
    })

    socket.on('player-connection', (connections) => {
        for (let i = 0; i < 2; i++) {
            if (connections[i]) {
                document.querySelector(`.p${i + 1} .img`).setAttribute('src', connections[i].image);
                document.querySelector(`.p${i + 1} .connected`).classList.add('active')
            } else {
                document.querySelector(`.p${i + 1} .img`).setAttribute('src', '/images/loading-gif.gif');
                document.querySelector(`.p${i + 1} .connected`).classList.remove('active')
            }
        }
    })

    socket.on('game-winner', (number) => {
        gameOver = true
        alert(`player ${number} win`)
        // window.location.href = `http://` + window.location.host
    })

    gameBoard.createBoard('user', gameboard)
    gameBoard.createBoard('enemy', gameboard)
    listShip.forEach(ship => gameBoard.randomShip(ship, 'user'))
    const userBlocks = document.querySelectorAll('#user div')
    const enemyBlocks = document.querySelectorAll('#enemy div')

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
            socket.emit('fire-reply', block.classList)
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
    }
}
function playerReadys() {
    if (gameOver) return
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
    if (!status) {
        alert('join room failed')
        window.location.href = `http://` + window.location.host
    }
}
const popup = document.querySelector('.popup')
const closePopup = document.querySelector('.close-popup');
function checkScore(user, userHit, userSunkShip) {
    function checkShip(shipName, shipLength) {
        if (userHit.filter(storedShipName => storedShipName == shipName).length == shipLength) {
            // const shipSunkSound = new Audio('./images/ShipSunk.mp3');
            // shipSunkSound.play();
            if (user == 'user') {
                userHits = userHit.filter(storedShipName => storedShipName != shipName)
                infoDisplay.textContent = user + ' sunk enemy ' + shipName
            }
            if (user == 'enemy') {
                enemyHits = userHit.filter(storedShipName => storedShipName != shipName)
                infoDisplay.textContent = user + ' sunk your ' + shipName
            }
            userSunkShip.push(shipName)
            popup.style.display = "block"
            closePopup.onclick = function () {
                popup.style.display = "none"
            }
        }
    }
    checkShip(listShip[0].name, listShip[0].length)
    checkShip(listShip[1].name, listShip[1].length)
    checkShip(listShip[2].name, listShip[2].length)
    checkShip(listShip[3].name, listShip[3].length)
    checkShip(listShip[4].name, listShip[4].length)
    if (userSunkShips.length == 5) {
        gameOver = true
        winner = playerNum
    }
    if (enemySunkShips.length == 5) {
        gameOver = true
        winner = playerNum % 2 + 1
    }
    if (gameOver && playerNum == winner) {
        socket.emit('game-winner', winner)
    }
}