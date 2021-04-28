class PUBGWin{
    constructor(){
        this.timestamp = + new Date();
        this.players = [];
    }

    /**
     * Add player to players array
     * @param {*} player 
     */
    addPlayer(player){
        this.players.push(player);
    }
}

module.exports = PUBGWin;