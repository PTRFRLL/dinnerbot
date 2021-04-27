class PUBGWin{
    constructor(timestamp){
        this.timestamp = timestamp;
        this.players = [];
    }
    addPlayer(player){
        this.players.push(player);
    }
}