module.exports = {
    createBoard,
    createQRCode,
    randomShip,
    checkScore
  }

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

// create board
function createBoard(user, gameboard) {
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

function createQRCode(url, gameboard){
    const board = document.createElement('div')
    // Generate the QR code using the Google Charts API
    const chartUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${url}&chs=256x256&choe=UTF-8&chld=L|0`;

    // Create an image element and set its source to the chart URL
    const img = document.createElement("img");
    img.src = chartUrl;

    // Append the image element to the page
    board.appendChild(img);

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

function checkScore(user, userHit, userSunkShip, infoDisplay, gameOver) {
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