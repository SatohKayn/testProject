const gameboard = document.querySelector('#gameContainer')
const optionContainer = document.querySelector('.ship-display')
const rotateButton = document.querySelector('#rotate-button')
const startButton = document.querySelector('#start-button')
const turnDisplay = document.querySelector('#turn-display')
const infoDisplay = document.querySelector('#info')
const hitSound = new Audio('/images/BombHit.mp3');
const missSound = new Audio('/images/BombMiss.mp3');
let angle = 0
let currentPlayer = 'user'
let gameOver = false
let userHits = []
let enemyHits = []
const userSunkShips = []
const enemySunkShips = []
const width = 10
import gameBoard from '../gameObject/gameBoard.js'
import listShip from '../gameObject/listShip.js'


startButton.addEventListener('click', startGameSingle)
function startGameSingle() {
    gameBoard.createBoard('user', gameboard)
    gameBoard.createBoard('enemy', gameboard)
    listShip.forEach(ship => gameBoard.randomShip(ship, 'enemy'))
    listShip.forEach(ship => gameBoard.randomShip(ship, 'user'))
    const computerBlock = document.querySelectorAll('#enemy div')
    computerBlock.forEach(block => block.addEventListener('click', handleClick))
    turnDisplay.textContent = 'Your Go'
    infoDisplay.textContent = ''
    currentPlayer = 'user'
    startButton.removeEventListener('click', startGameSingle)
}

let lastHit = []
function computerGo() {
    if (!gameOver) {
        turnDisplay.textContent = 'Computer Go'
        infoDisplay.textContent = ''
        computerMaveMove()
        if(currentPlayer == 'user'){
            setTimeout(() => {
                turnDisplay.textContent = 'Your Go'
                infoDisplay.textContent = ''
                currentPlayer = 'user'
                const computerBlock = document.querySelectorAll('#enemy div')
                computerBlock.forEach(block => block.addEventListener('click', handleClick))
            }, 1000)
        }
        
    }
}

function computerMaveMove() {
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
        currentPlayer = 'enemy'
        setTimeout(computerMaveMove, 1000)
    } else {
        missSound.play();
        infoDisplay.textContent = 'Computer miss'
        currentPlayer = 'user'
        userBlock[randomGo].classList.add('miss')
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


function handleClick(e) {
    if (!gameOver && currentPlayer == 'user') {
        if (!e.target.classList.contains('miss') && !e.target.classList.contains('boom')) {
            if (e.target.classList.contains('taken')) {

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
        infoDisplay.textContent = 'Player Win'
    }
    if (enemySunkShips.length == 5) {
        gameOver = true
        infoDisplay.textContent = 'Enemy Win'
    }
    if(gameOver)
    {
        startButton.addEventListener('click', () => {
            location.reload()
        })
    }
}