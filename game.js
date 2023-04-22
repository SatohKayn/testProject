const gameboard = document.querySelector('#gameContainer')
const optionContainer = document.querySelector('.ship-display')
const rotateButton = document.querySelector('#rotate-button')
const startButton = document.querySelector('#start-button')
const turnDisplay = document.querySelector('#turn-display')
const infoDisplay = document.querySelector('#info')
let angle = 0
let currentPlayer = 'user'
let gameOver = false
let playerNum = null
let userHits = []
let enemyHits = []
let playerReady = false
let enemyReady = false
const userSunkShips = []
const enemySunkShips = []
const width = 10
let gameCode = null
let shot = -1;
let roomId = null
// Create Ship
class Ship {
    constructor(name, length) {
        this.name = name
        this.length = length
    }
}

const ship1 = new Ship('destroyer', 2)
const ship2 = new Ship('submarine', 3)
const ship3 = new Ship('cruiser', 3)
const ship4 = new Ship('battleship', 4)
const ship5 = new Ship('carrier', 5)

const listShip = [ship1, ship2, ship3, ship4, ship5]

if (pageIndex == 0) {
    const singlePlayButton = document.querySelector('#singlePlayButton')
    const createRoomButton = document.querySelector('#createGameButton')
    const joinGameButton = document.querySelector('#joinGameButton')
    singlePlayButton.addEventListener('click', () => {
        window.location.href = "http://localhost:3000/single"
    })
    createRoomButton.addEventListener('click', () => {
        const socket = io();

        socket.emit('create-room', () => { })

        socket.on('getRoomId', (getRoomId) => {
            roomId = getRoomId
            window.location.href = `http://localhost:3000/multi/rooms/${roomId}`
        })
    })

    joinGameButton.addEventListener('click', () => {
        roomId = document.getElementById('gameCodeInput').value
        window.location.href = `http://localhost:3000/multi/rooms/${roomId}`
    })
}

if (pageIndex == 1)
    startButton.addEventListener('click', startGameSingle);

if (pageIndex == 2){
    gameCode = window.location.pathname.split('/').pop();
    joinGame(gameCode)
} 

function joinGame(gameCode) {
    const socket = io();
    roomId = gameCode
    startButton.addEventListener('click', function () {
        playerReadys()
    })

    socket.emit('join-room', roomId)

    socket.on('join-room-status', (status) => { handleJoinRoom(status) })

    document.getElementById('room-code').textContent = roomId;

    const copyButton = document.getElementById('copy-button');
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        alert('URL copied to clipboard');
    });

    socket.on('enemy-ready', (enemystatus, msg) => { handleEnemyReady(enemystatus, msg) })

    socket.on('player-number', (num) => {
        playerNum = parseInt(num)
        if(playerNum == 1)
            currentPlayer = 'user'
        else
            currentPlayer = 'enemy'
    })

    socket.on('check-player', (roomStatus) => {
        console.log(roomStatus)
        if (roomStatus) {
            document.getElementById('code-display').style.display = "none";
            // document.querySelector('.setup-buttons').style.display = "none";
            handlePlayGameMulti()
            
        }
    })
    createBoard('user')
    createBoard('enemy')
    listShip.forEach(ship => randomShip(ship, 'user'))
    const userBlocks = document.querySelectorAll('#user div')
    const enemyBlocks = document.querySelectorAll('#enemy div')
    function playerReadys() {
        if (gameOver) return
        socket.emit('player-ready')
        playerReady = true
        document.querySelector(`.player p${playerNum} .connected`).classList.toggle('active')
    }

    function handleEnemyReady(enemystatus, msg) {
        enemyReady = enemystatus
        socket.emit('check-player')
    }

    function handlePlayGameMulti() {
        // socket.on('player-turn', (playerTurn) => {
        //     if(playerTurn == playerNum){
        //         currentPlayer = 'user'
        //         turnDisplay = 'Your Turn'
        //     } else {
        //         currentPlayer = 'enemy'
        //         turnDisplay = 'Enemy Turn'
        //     }
        // })
        enemyBlocks.forEach(block => block.addEventListener('click', () => {
            if (currentPlayer == 'user' && !gameOver) {
                if (!block.classList.contains('boom') && !block.classList.contains('miss')) {
                    shot = block.getAttribute('id')
                    socket.emit('fire', shot)
                }
            }
        }))

        socket.on('fire', (id) => {
            if (userBlocks[id].classList.contains('taken')) {
                userBlocks[id].classList.add('boom')
                let classes = Array.from(userBlocks[id].classList)
                classes = classes.filter(classname => classname != 'block')
                classes = classes.filter(classname => classname != 'boom')
                classes = classes.filter(classname => classname != 'taken')
                enemyHits.push(...classes)
                checkScore('enemy', enemyHits, enemySunkShips)
                currentPlayer = 'enemy'
            } else {
                userBlocks[id].classList.add('miss')
                currentPlayer = 'user'
            }

            const block = userBlocks[id]
            socket.emit('fire-reply', block.classList)
        })

        // On Fire Reply Received
        socket.on('fire-reply', classList => {
            const enemySquare = enemyBlocks[shot]
            const obj = Object.values(classList)
            if (currentPlayer === 'user' && !gameOver) {
                if (obj.includes('taken')) {
                    enemySquare.classList.add('boom')
                    let classes = Array.from(enemySquare.classList)
                    classes = classes.filter(classname => classname != 'block')
                    classes = classes.filter(classname => classname != 'boom')
                    classes = classes.filter(classname => classname != 'taken')
                    userHits.push(...classes)
                    checkScore('user', userHits, userSunkShips)
                    currentPlayer = 'user'
                } else {
                    enemySquare.classList.add('miss')
                    currentPlayer = 'enemy'
                }

            }
        })
    }
}


function startGameSingle() {
    createBoard('user')
    createBoard('enemy')
    listShip.forEach(ship => randomShip(ship, 'enemy'))
    listShip.forEach(ship => randomShip(ship, 'user'))
    const computerBlock = document.querySelectorAll('#enemy div')
    computerBlock.forEach(block => block.addEventListener('click', handleClick))
    turnDisplay.textContent = 'Your Go'
    infoDisplay.textContent = ''
    currentPlayer = 'user'
}


// rotate ship
function rotate() {
    angle = angle == 0 ? 90 : 0
    const optionShips = Array.from(optionContainer.children)
    optionShips.forEach(optionship => optionship.style.transform = `rotate(${angle}deg)`)

}
// rotateButton.addEventListener('click', rotate)

// create board
function createBoard(user) {
    const board = document.createElement('div')
    board.classList.add('grid-board')
    board.id = user
    for (let i = 0; i < width * width; i++) {
        const block = document.createElement('div')
        block.classList.add('block')
        block.id = i
        board.append(block)
    }
    gameboard.append(board)
}

function randomShip(ship, user) {
    const computerBlock = document.querySelectorAll(`#${user} div`)
    let randomIndex = Math.floor(Math.random() * width * width)
    let randomDirection = Math.random() < 0.5
    let shipBlocks = []
    if (randomDirection) {
        let validNum = Math.floor(randomIndex / width) * width + (width - ship.length)
        if (randomIndex > validNum) {
            randomIndex = validNum
        }

    } else {
        let validNum = Math.floor(randomIndex % width) + (width - ship.length) * width
        if (randomIndex / width > validNum / width) {
            randomIndex = validNum
        }

    }
    for (let i = 0; i < ship.length; i++) {
        if (randomDirection) {
            shipBlocks.push(computerBlock[Number(randomIndex) + i])
        } else {
            shipBlocks.push(computerBlock[Number(randomIndex) + i * width])
        }
    }
    const nottaken = shipBlocks.every(shipBlock => !shipBlock.classList.contains('taken'))
    if (nottaken) {
        let directionclass = 0
        shipBlocks.forEach(shipBlock => {
            shipBlock.classList.add(ship.name)
            shipBlock.classList.add('taken')
            if (user == 'user') {
                if (directionclass == 0) {
                    shipBlock.classList.add('start')
                } else if (directionclass == ship.length - 1) {
                    shipBlock.classList.add('end')
                }
                directionclass++;
                if (randomDirection) {
                    shipBlock.classList.add('horizontal')
                } else {
                    shipBlock.classList.add('vertical')
                }
            }
        })
    } else {
        randomShip(ship, user)
    }
}



function handleClick(e) {
    if (!gameOver && currentPlayer == 'user') {
        if (!e.target.classList.contains('miss') && !e.target.classList.contains('boom')) {
            if (e.target.classList.contains('taken')) {
                const hitSound = new Audio('./images/BombHit.mp3');
                hitSound.play();
                e.target.classList.add('boom')
                infoDisplay.textContent = 'You hit something'
                let classes = Array.from(e.target.classList)
                classes = classes.filter(classname => classname != 'block')
                classes = classes.filter(classname => classname != 'boom')
                classes = classes.filter(classname => classname != 'taken')
                userHits.push(...classes)
                checkScore('user', userHits, userSunkShips)
                currentPlayer = 'user'
            } else {
                const missSound = new Audio('./images/BombMiss.mp3');
                missSound.play();
                e.target.classList.add('miss')
                infoDisplay.textContent = 'Miss'
                const computerBlock = document.querySelectorAll('#computer div')
                computerBlock.forEach(block => block.replaceWith(block.cloneNode(true)))
                currentPlayer = 'enemy'
                setTimeout(computerGo, 1000)
            }
        }
    }
}
let lastHit = []
function computerGo() {
    if (!gameOver) {
        turnDisplay.textContent = 'Computer Go'
        infoDisplay.textContent = ''
        setTimeout(computerMaveMove, 1000)
        setTimeout(() => {
            turnDisplay.textContent = 'Your Go'
            infoDisplay.textContent = ''
            currentPlayer = 'user'
            const computerBlock = document.querySelectorAll('#enemy div')
            computerBlock.forEach(block => block.addEventListener('click', handleClick))
        }, 2000)
    }
}

function computerMaveMove() {
    if (!gameOver) {
        let randomGo = null
        let lastIndex = lastHit.length - 1
        const userBlock = document.querySelectorAll('#user div')
        infoDisplay.textContent = 'Computer is thinking'
        if (lastHit.length == 1) {
            const directions = [-1, 1, width, -width]
            const nextHit = []
            for (let i = 0; i < directions.length; i++) {
                let guess = lastHit[lastIndex] + directions[i]
                if (isValidGuess(guess))
                    nextHit.push(guess)
            }
            for (let i = 0; i < nextHit.length; i++) {
                if (isValidGuess(nextHit[i])) {
                    randomGo = nextHit[i]
                    break;
                }
            }
            if (randomGo == null)
                lastHit.splice(lastIndex, 1)
        }
        if (lastHit.length >= 2) {
            let direction = lastHit[0] - lastHit[1]
            let guess = lastHit[lastIndex] - direction
            if (isValidGuess(guess))
                randomGo = guess
            else {
                for (let i = lastHit.length - 1; i > 0; i--) {
                    lastHit.pop(i, 1)
                }
                if (isValidGuess(lastHit[0] + direction)) {
                    randomGo = lastHit[0] + direction
                } else {
                    lastHit.splice(0, 1)
                }
            }

        }
        //if no hit blocks, randomly pick a block
        if (randomGo == null) {
            randomGo = Math.floor(Math.random() * width * width);

            //check if block at index has already been attacked, try again if it has
            while (userBlock[randomGo].classList.contains('boom') || userBlock[randomGo].classList.contains('miss')) {
                randomGo = Math.floor(Math.random() * width * width);
            }
        }
        if (userBlock[randomGo].classList.contains('taken')) {
            const hitSound = new Audio('./images/BombHit.mp3');
            hitSound.play();

            userBlock[randomGo].classList.add('boom')
            infoDisplay.textContent = 'Computer hit your ship'
            let classes = Array.from(userBlock[randomGo].classList)
            classes = classes.filter(classname => classname != 'block')
            classes = classes.filter(classname => classname != 'boom')
            classes = classes.filter(classname => classname != 'taken')
            enemyHits.push(...classes)
            checkScore('enemy', enemyHits, enemySunkShips)
            lastHit.push(randomGo)
            setTimeout(computerMaveMove, 1000)
        } else {
            const missSound = new Audio('./images/BombMiss.mp3');
            missSound.play();
            infoDisplay.textContent = 'Computer miss'
            userBlock[randomGo].classList.add('miss')
        }
    }

}

function isValidGuess(index) {
    const userBlock = document.querySelectorAll('#user div')
    if (index < 0 || index > 99) {
        return false
    }
    if (userBlock[index].classList.contains('boom') ||
        userBlock[index].classList.contains('miss')) {
        return false
    }
    return true
}

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
        }
    }
    checkShip(listShip[0].name, listShip[0].length)
    checkShip(listShip[1].name, listShip[1].length)
    checkShip(listShip[2].name, listShip[2].length)
    checkShip(listShip[3].name, listShip[3].length)
    checkShip(listShip[4].name, listShip[4].length)
    if (userSunkShips.length == 5) {
        gameOver = true
        infoDisplay.textContent = 'Player Win'
    }
    if (enemySunkShips.length == 5) {
        gameOver = true
        infoDisplay.textContent = 'Enemy Win'
    }
}

function handleJoinRoom(status) {
    if (!status) {
        alert('join room failed')
        window.location.href = "http://localhost:3000"
    }
}
