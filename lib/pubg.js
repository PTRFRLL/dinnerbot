const axios = require('axios');
const logger = require('./log');
let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../config');
}

const instance = axios.create({
    baseURL: 'https://api.playbattlegrounds.com/shards/pc-na/',
    headers: {
        'Authorization': `Bearer ${CONFIG.services.PUBG_API_KEY}`,
        'Accept': 'application/vnd.api+json'
    }
});

const STATS = {
    "assists": 'SUM',
    "boosts": 'SUM',
    "dBNOs": 'SUM',
    "damageDealt": 'SUM',
    "days": 'SUM',
    "dailyWins": 'SUM',
    "headshotKills": 'SUM',
    "heals": 'SUM',
    "kills": 'SUM',
    "longestKill": 'MAX',
    "longestTimeSurvived": 'MAX',
    "losses": 'SUM',
    "maxKillStreaks": 'MAX',
    "revives": 'SUM',
    "rideDistance": 'SUM',
    "roadKills": 'SUM',
    "roundsPlayed": 'SUM',
    "suicides": 'SUM',
    "swimDistance": 'SUM',
    "teamKills": 'SUM',
    "timeSurvived": 'SUM',
    "top10s": 'SUM',
    "vehicleDestroys": 'SUM',
    "walkDistance": 'SUM',
    "weaponsAcquired": 'SUM',
    "wins": 'SUM',
};

const getPlayerData = async (playerId, numMatches) => {
    try{
        let player = await instance.get(`players/${playerId}`);
        let data = player.data.data;
        let matches = {
            id: data.id,
            matches: data.relationships.matches.data.map(m => m.id).slice(0, numMatches)
        };
        return matches;
    }catch(e){
        logger.error(`Error getting player data: ${e}`);
    }
    
}

const getPlayerDetails = async(username) => {
    try{
        let player = await instance.get(`players?filter[playerNames]=${username}`);
        logger.debug(`PUBG API found player id: ${player.data.data[0].id}`);
        return player.data.data[0];
    }catch(e){
        logger.error(e);
        return undefined;
    }
}

const getLatestWin = async(playerId) => {
    try{
        let numGames = 50;
        let player = await getPlayerData(playerId, numGames);
        let results = await Promise.all(player.matches.map(async (match) =>  {
            return await getMatch(match, player.id);
        }));
        const winning = results.filter(match => {
            return match.place == 1;
        });
        if(winning.length == 0){
            return undefined;
        }else{
            return winning[0];
        }
    }catch(e){
        logger.error(e);
        throw new Error(e);
    }
};

const queryLifeTimeStats = async(playerId) => {
    let stats = await instance.get(`/players/${playerId}/seasons/lifetime`);
    let data = stats.data.data;
    return data.attributes.gameModeStats;
};

const sumStats = (statList, stat) => {
    return Reflect.ownKeys(statList).map(mode => {
        logger.debug(`MODE: ${mode} | STAT: ${stat}`);
        logger.debug(statList[mode][stat])
        return statList[mode][stat];
    }).reduce((acc, current) => {
        return acc + current;
    }, 0);
};

const maxStats = (statList, stat) => {
    let arr = Reflect.ownKeys(statList).map(mode => {
        logger.debug(`MODE: ${mode} | STAT: ${stat}`);
        logger.debug(statList[mode][stat])
        return statList[mode][stat];
    });
    return Math.max(...arr);
};


//return match and player data in a more flat/readable format
const getMatch = async (matchId, player) => {
    let match = await instance.get(`matches/${matchId}`);
    let data = match.data.data;
    let participants = match.data.included.filter(x => {
        return x.type === 'participant';
    });

    //get list of teams
    let teams = match.data.included.filter(x => {
        return x.type === 'roster';
    });

    //get player obj
    let matchPlayer = participants.find(x => {
        return x.attributes.stats.playerId == player;
    });

    //get players team
    let team = teams.find(x => {
        return x.relationships.participants.data.some(y => {
            return y.id == matchPlayer.id;
        });
    });

    //get players team members
    let teamMembers = team.relationships.participants.data.map(x => x.id);

    //filter out player from team
    teamMembers = teamMembers.filter(x => x !== matchPlayer.id);

    //get team members objs
    let members = participants.filter(p => {
        return teamMembers.includes(p.id);
    });


    //return team member names/kills
    members = members.map(m => {
        //console.log(m.attributes.stats);
        let stats = m.attributes.stats;
        let member = {
            name: stats.name,
            kills: stats.kills,
            timeSurvived: secToMin(stats.timeSurvived),
            revives: stats.revives,
            headshotKills: stats.headshotKills,
            damageDealt: stats.damageDealt,
            DBNOs: stats.DBNOs,
            survivalTime: stats.timeSurvived
        };
        return member;
    });

    let returned = {
        matchId: matchId,
        mode: data.attributes.gameMode,
        date: data.attributes.createdAt,
        map: validateMapName(data.attributes.mapName),
        place: team.attributes.stats.rank,
        kills: matchPlayer.attributes.stats.kills,
        revives: matchPlayer.attributes.stats.revives,
        headshotKills: matchPlayer.attributes.stats.headshotKills,
        damageDealt: matchPlayer.attributes.stats.damageDealt,
        DBNOs: matchPlayer.attributes.stats.DBNOs,
        timeSurvived: secToMin(matchPlayer.attributes.stats.timeSurvived),
        survivalTime: matchPlayer.attributes.stats.timeSurvived,
        team: members
    };
    return returned;
};

const validateMapName = (map) => {
    const maps = {
        DihorOtok_Main: "Vikendi",
        Desert_Main: "Miramar",
        Erangel_Main: "Erangel",
        Baltic_Main: "Erangel",
        Savage_Main: "Sanhok",
        Summerland_Main: "Karakin",
        Chimera_Main: "Paramo"
    };
    if(maps.hasOwnProperty(map)){
        return maps[map];
    }
    return map;
}

const secToMin = (seconds) => {
    seconds = Math.floor(seconds);
    let min = Math.floor(seconds/60);
    let secRemain = seconds - (min * 60);
    return `${min}m ${secRemain.toFixed(0)}s`
};

/**
 * Returns lifetime stat from PUBG API
 * @param {*} username - PUBG username
 * @param {*} stat - what stat to query ()
 */
const getLifeTimeStats = async(playerId, requestedStats) => {
    //let player = await getPlayerData(username, 1);
    let stats = await queryLifeTimeStats(playerId);
    const statistics = requestedStats.map(stat => {
        let value = 0;
        let type = STATS[stat];
        if(type === 'MAX'){
            value = maxStats(stats, stat);
        }else{
            value = sumStats(stats, stat);
            
        }
        return {
            name: stat,
            value
        };
    });
    return statistics;
};



module.exports = {
    getLifeTimeStats,
    getLatestWin,
    getPlayerDetails,
    STATS
}