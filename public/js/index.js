const singlePlayButton = document.querySelector('#singlePlayButton')
const createRoomButton = document.querySelector('#createGameButton')
const joinGameButton = document.querySelector('#joinGameButton')
const rankGameButton = document.querySelector('#rankGameButton')
singlePlayButton.addEventListener('click', () => {
    window.location.href = window.location.protocol + "single"
})
rankGameButton.addEventListener('click', () => {
    window.location.href = window.location.protocol + "rank"
})

createRoomButton.addEventListener('click', () => {
    window.location.href = window.location.protocol + `multi/createroom`
})

joinGameButton.addEventListener('click', () => {
    roomId = document.getElementById('gameCodeInput').value
    window.location.href = window.location.protocol + `multi/rooms/${roomId}`
})