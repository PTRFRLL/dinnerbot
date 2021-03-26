const logger = require('../log');
let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../../config');
}
const {autoStats} = require('../stats');
const {logPlayerWin} = require('../db_utils');

let winners = [];
const modes = ['Sanhok', 'Vikendi', 'Erangel', 'Miramar', 'Karakin', 'Erangel (Remastered)', 'Paramo'];

const presenceUpdate = async(old, updated) => {
  try{
    const oldActivities = old?.activities;
    const newActivities = updated?.activities;

    
    if(!newActivities || newActivities.length === 0){
      return;
    }
    const PUBG_ID = "530196305138417685";
    //get PUBG activity
    const oldPresence = oldActivities.find(act => act.applicationID === PUBG_ID);
    const newPresence = newActivities.find(act => act.applicationID === PUBG_ID); 
  

    //we only care about PUBG
    if(!newPresence) return;

    logger.debug(`PUBG presence found: ${JSON.stringify(newPresence)}`)

    //new presence is a win...
    if (newPresence.details.includes("Winner Winner Chicken Dinner!")) {
      logger.log(`Win detected by presence, pre-exclude: ${newPresence.details}`);
      let winningMode = newPresence.details.split(', ');
      if(winningMode.length > 1 && !modes.includes(winningMode[1])){
        logger.log(`Ignoring mode [${winningMode[1]}] split from ${newPresence.details} for ${updated.user.username}`);
        return;
      }
      //...but they were dead, so add to spectators
      if(!oldPresence || !oldPresence.details){
        logger.log(`Old presence details undefined: ${oldPresence}`);
      }
      if (oldPresence.details !== null && oldPresence.details.includes("Watching")) {
        logger.log(`Spectator win detected via presence for ${updated.user.username}, adding to spectators`);
        winners.push({
          user: updated.user,
          timestamp: + new Date(),
          isDead: true
        });
        //presense gets updated to 'winner winner...' twice, so check this is the first time
      } else if (oldPresence.details !== null && !oldPresence.details.includes("Winner Winner Chicken Dinner!")) {
        logger.log(`Win detected via presence for ${updated.user.username}, adding to winners`);
        winners.push({
          user: updated.user,
          timestamp: + new Date(),
          isDead: false
        });
      } else {
        logger.log(`Win detected for ${updated.user.username} BUT old presence also a win, skipping add to array...`);
      }
    }
    if (oldPresence && oldPresence.details !== null && oldPresence.details.includes("Winner Winner Chicken Dinner!") && !newPresence.details.includes("Winner Winner Chicken Dinner!")) {
      //players have left winner screen, send message
      logger.log(`Post win for ${old.user.username}: [${oldPresence.details}] => [${newPresence.details}]`);
      const channel = updated.guild.channels.cache.get(CONFIG.app.DISCORD_CHANNEL);
      const playerWin = {
        username: old.user.username,
        discord_id: old.user.id,
        state: oldPresence.state
      };
      await logPlayerWin(playerWin);
      let checkDate = new Date(Date.now() - 5000 * 60).getTime();
      try {
        if (winners.length === 0) return;
        let alive = winners.filter(player => player.isDead === false);
        let dead = winners.filter(player => player.isDead === true);
        let response =
          CONFIG.app.BOT_PRESENCE_RESPONSES[
            Math.floor(Math.random() * CONFIG.app.BOT_PRESENCE_RESPONSES.length)
          ];
        let winningUsers = alive.filter((winner) => winner.timestamp > checkDate).map(winner => {
          return `<@${winner.user.id}>`; 
        })
        response = response.replace("[USER]", winningUsers.join(" "));
        channel.send(response);

        //if we have spectators, send a message for them too
        if(dead.length > 0){
          logger.log(`Spectators found, mentioning them too...`);
          let deadWinnersRes =
          CONFIG.app.BOT_SPECTATOR_RESPONSES[
            Math.floor(
              Math.random() * CONFIG.app.BOT_SPECTATOR_RESPONSES.length
            )
          ];
          let spectatorUsers = dead.filter((spec) => spec.timestamp > checkDate).map(spec => {
            return `<@${spec.user.id}>`; 
          })

          deadWinnersRes = deadWinnersRes.replace(
            "[USER]",
            spectatorUsers.join(" ")
          );
          channel.send(deadWinnersRes);
        }
        //trigger stat lookup, if API key supplied
        if(CONFIG.services.PUBG_API_KEY && CONFIG.services.PUBG_API_KEY !== ''){
          await autoStats(winners, channel);
        }
        //clear array
        winners.length = 0;
      } catch (e) {
        logger.error(`Error sending winner presence response: ${e}`);
        //clear array
        winners.length = 0;
      }
    }
  }catch(e){
    logger.error(`Discord.js: Error in presenceUpdate`)
    logger.error(e);
  }
}


module.exports = {
    presenceUpdate
};