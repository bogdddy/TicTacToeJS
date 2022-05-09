// window.onload = function() {
//   const url = window.location.origin;
//   let socket = io.connect(url);
// };

const url = window.location.origin;
let socket = io.connect(url);

// add listeners to buttons and board
$(document).ready(() => {

  $("#createRoom").click(function () {
    socket.emit("create_room")
  })

  $("#joinRoom").click(function () {
    socket.emit("join_room", $("#roomCode").val())
  })

  $(".cell").on("click", makeMove);

})

var game = new Game()

/**
 * Send move to server
 */
function makeMove() {

  if (game.my_symbol != game.turn)
    return

  // The space is already checked
  if ($(this).text().length)
    return

  // Emit the move to the server
  if (game.playing)
    socket.emit("make_move", $(this).attr("id"))
}

/**
 * recive room code
 */
socket.on("room_created", function (room_code) {
  console.log(room_code);
})

/**
 * wrong room code
 */
socket.on("room_doesnt_exist", function () {
  console.log("room doesnt exist");
})

/**
 * recieve game data
 */
socket.on("start_game", function(data){
  game.playing = true
  game.my_symbol = data.symbol
  game.turn = data.turn
})

/**
 * recieve move
 */
socket.on("move_made", function (data) {

  $(`#${data.cell}`).html(data.symbol)
  game.changeTrun()

});

/**
 * wrong move was made
 */
socket.on("wrong_move", () => {
  console.log("wrong move");
})

/**
 * game ended
 */
socket.on("game_over", function(data){
  console.log(data.winner);
  game.playing = false
})