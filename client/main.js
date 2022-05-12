const url = window.location.origin;
let socket = io.connect(url);

var game = new Game()

// add listeners board and show start modal
$(document).ready(() => {

  $(".cell").on("click", makeMove);

  showStartModal()

})

/**
 * Shows modal with createRoom and joinRoom buttons
 */
 function showStartModal() {

  Swal.fire({
    icon: 'question',
    html: '<button id="createRoom" onclick="createRoom()"> Create room </button> <button id="joinRoom" onclick="joinRoom()"> Join room </button>',
    showConfirmButton: false,
    allowOutsideClick: false,
  })

}

// EMIT TO SERVER 

/**
 * emit create room
 */
 function createRoom() {
  socket.emit("create_room")
}

/**
 * ask for room code and send to server
 */
async function joinRoom() {

  const { value: room_code } = await Swal.fire({
    title: 'Enter room code',
    input: 'number',
    inputPlaceholder: 'room code',
    willClose: showStartModal
  })

  if (room_code)
    socket.emit("join_room", room_code)
}

/**
 * send move to server
 */
 function makeMove() {

  // check turn
  if (game.my_symbol != game.turn)
    return

  // The space is already checked
  if ($(this).html().length)
    return

  // emit the move to the server
  if (game.playing)
    socket.emit("make_move", $(this).attr("id"))
}

// RECIEVE FROM SERVER 

/**
 * recive and show room code
 */
socket.on("room_created", function (room_code) {

  Swal.fire({
    title: 'Your room code is ' + room_code,
    html: 'Waiting for opponent <br><br> <div class="lds-dual-ring"></div>',
    allowOutsideClick: false,
    showConfirmButton: false
  })

})

/**
 * wrong room code
 */
socket.on("room_doesnt_exist", function () {
  
  Swal.fire({
    title: "room doesn't exist",
  }).then(() => showStartModal())

})

/**
 * room full
 */
socket.on("room_full", function () {

  Swal.fire({
    title: "room full :c",
  }).then(() => showStartModal())

})

/**
 * recieve game data
 */
socket.on("start_game", function (data) {

  Swal.fire({ title: 'opponent joined', text: `Your symbol is : ${data.symbol}` })

  game.resetBoard()
  game.playing = true
  game.my_symbol = data.symbol
  game.turn = data.turn
  $("#alerts").html(game.turn+"'s turn")

})

/**
 * recieve move
 */
socket.on("move_made", function (data) {

  $(`#${data.cell}`).html(data.symbol)
  game.changeTrun()

});

/**
 * wrong move
 */
socket.on("wrong_move", () => {
  Swal.fire({
    toast: true,
    title: '<p style="text-align: center"> wrong move </p>',
    icon: "warning",
    position: 'center',
    showConfirmButton: false,
    timer: 1000,
    width: '25%',
  })
})

/**
 * game ended
 */
socket.on("game_over", function (data) {
  
  game.playing = false

  Swal.fire({

    text: data.winner == 'draw' ? "DRAW !!" : `${data.winner} WINS !!`,
    imageUrl: 'images/win.jpg',
    imageWidth: 400,
    imageHeight: 300,

  }).then(() => {
    showStartModal()
  })

})

/**
 * opponent disconnected
 */
socket.on("opponent_disconnected", () => {

  Swal.fire({
    text: 'Your opponennt has disconnected',
  }).then(() => {
    showStartModal()
  })

})
