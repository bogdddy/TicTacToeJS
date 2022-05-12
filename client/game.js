class Game {

    constructor (){
        this.playing = false
        this.my_symbol = ""
        this.turn = ""
    }

    changeTrun(){
        this.turn = this.turn == "X" ? "O" : "X"
        $("#alerts").html(this.turn+"'s turn")
    }

    resetBoard(){
        $(".cell").html("")
    }

}