const {winnerWinner, getMessageUsers} = require('../discord');
const {deleteFile} = require("../utils");
const {recordHash} = require("../db_utils");
const logger = require('../log')('events/wins');
const WinDetector = require('../winDetector');



const determineWin = async(url, message) => {
    try {
      const screenshot = new WinDetector(url);
      await screenshot.determineWin();
      if(screenshot.imageAlreadyExists){
        message.reply(`Hey, I've seen this image before. Are you trying to game the system there bud?`);
        deleteFile(screenshot.imgPath);
        return;
      }
      if(screenshot.isWin){
        await recordHash(message.id, screenshot.imgHash, message.author.username);
        let users = getMessageUsers(message);
        await winnerWinner(message, users, screenshot.imgPath, screenshot.formattedScore);
      }else{
        message.react("❓");
        message.react("🤷");
      }
      deleteFile(screenshot.imgPath);
    } catch (err) {
      await message.react("💀");
      await message.react("🇭");
      await message.react("🇪");
      await message.react("🇱");
      await message.react("🇵");
      await message.react("‼");
      logger.error(err);
    }
}


module.exports = {
  determineWin
}