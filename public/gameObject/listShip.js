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

export default listShip;