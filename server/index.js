const http = require("http")
const express = require("express")
const app = express()
const socketIo = require("socket.io")
const fs = require("fs");

const server = http.Server(app).listen(8080)
const io = socketIo(server);

app.use(express.static(__dirname + "/../client/"))

/**
 * API base PATH -> returns index.html
 */
app.get("/", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/../client/index.html")
    stream.pipe(res)
});

var rooms = {}

/**
 * When web socket recives a connection
 */
io.on("connection", function (socket) {

    // create a room
    socket.on("create_room", function () {

        let room = createRoom()

        socket.join(room)
        rooms[room] = {
            "player1": socket,
            "player2": null,
            "board": createBoard(),
            "turn": "X",
        }

        socket.emit("room_created", room)
    })

    // join a room
    socket.on("join_room", function (room) {

        // check if room exists
        if (rooms.hasOwnProperty(room)) {

            // check if room not full
            if (rooms[room].player2)
                socket.emit("room_full")
            else {
                socket.join(room)
                rooms[room].player2 = socket
                startGame(room)
            }

        } else
            socket.emit("room_doesnt_exist")

    })

    // make a move
    socket.on("make_move", function (cell) {

        let room = findPlayersRoom(socket)

        if (rooms[room].board[cell] == "-"){

            // update board
            rooms[room].board[cell] = rooms[room].turn

            // emit move
            io.to(room).emit("move_made", {"cell": cell, "symbol": rooms[room].turn})

            // change turn
            rooms[room].turn = rooms[room].turn == "X" ? "O" : "X"

            // check if game is over
            let [gameOver, winner] = isGameOver(rooms[room].board)
            if (gameOver){
                io.to(room).emit("game_over", {"winner": winner})
                endGame(room)
            }

        }else
            socket.emit("wrong_move")

    })

    // On player disconnect
    socket.on("disconnect", () => {

        let room = findPlayersRoom(socket)
        if (room){
            io.to(room).emit("opponent_disconnected")
            endGame(room)
        }

    });

});

/**
 * Create a random room number that doesn't already exist
 * @returns -> room number
 */
const createRoom = () => {
    let room = Math.floor(1000 + Math.random() * 9000) + 1

    if (!rooms.hasOwnProperty(room))
        return room.toString()
}

/**
 * Emit to both players the game has started
 * @param {*} room -> player's room
 */
function startGame(room) {

    rooms[room].player1.emit("start_game", {"symbol": "X", "turn": "X"})
    rooms[room].player2.emit("start_game", {"symbol": "O", "turn": "X"})

}

/**
 * Create empty board
 * @returns 
 */
function createBoard() {

    return {
        "A1": "-", "A2": "-", "A3": "-",
        "B1": "-", "B2": "-", "B3": "-",
        "C1": "-", "C2": "-", "C3": "-",
    }

}

/**
 * Find player's room
 * @param {*} player 
 * @returns -> room number
 */
const findPlayersRoom = (player) => {

    for (let room in rooms){
        if (rooms[room].player1 == player || rooms[room].player2 == player)
            return room
    }

}

/**
 * Checks if game has ended
 * @param {*} board 
 * @returns -> touple [ game_over(boolean), winner]
 */
function isGameOver(board) {
    
    let matches = ["XXX", "OOO"],
    
    winning_combinations = [
        board.A1 + board.A2 + board.A3,
        board.B1 + board.B2 + board.B3,
        board.C1 + board.C2 + board.C3,
        board.A1 + board.B2 + board.C3,
        board.A3 + board.B2 + board.C1,
        board.A1 + board.B1 + board.C1,
        board.A2 + board.B2 + board.C2,
        board.A3 + board.B3 + board.C3
    ]

    // check winning combonations
    for (let i in winning_combinations){

        if (winning_combinations[i] === matches[0]) 
            return [ true, matches[0][0] ]
        else if (winning_combinations[i] === matches[1])
            return [ true, matches[1][0] ]
          
    }

    // check if board is full
    for (let cell in board){
        if (board[cell] === "-")
            return [ false, null]
        }
        
    return [ true, "draw"]

}

/**
 * Disconnects players and deletes room
 * @param {*} room -> room number
 */
function endGame(room){
    
    rooms[room].player1.leave(room)
    if (rooms[room].player2)
        rooms[room].player2.leave(room)

    delete rooms[room]
}