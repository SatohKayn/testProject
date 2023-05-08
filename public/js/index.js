const singlePlayButton = document.querySelector('#singlePlayButton')
const createRoomButton = document.querySelector('#createGameButton')
const joinGameButton = document.querySelector('#joinGameButton')

singlePlayButton.addEventListener('click', () => {
    window.location.href = window.location.protocol + "single"
})

createRoomButton.addEventListener('click', () => {
    window.location.href = window.location.protocol + `multi/createroom`
})

joinGameButton.addEventListener('click', () => {
    roomId = document.getElementById('gameCodeInput').value
    window.location.href = window.location.protocol + `multi/rooms/${roomId}`
})