class Game {

    constructor (){
        this.playing = false
        this.my_symbol = ""
        this.turn = ""
    }

    changeTrun(){
        this.turn = this.turn == "X" ? "Y" : "X"
    }

}