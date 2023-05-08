const width = 10
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


export default { createBoard, randomShip }