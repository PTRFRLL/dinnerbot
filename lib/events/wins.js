let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../../config');
}
const utils = require("../utils");
const db = require("../db_utils");
const logger = require('../log');
const {isWinningScreenshot} = require("../vision");
const discord = require('../discord');
const getImgCompareScore = require('../compare');


const checkScore = async(url, message) => {
    try {
      let imageProps = await utils.getImage(url);
      const existingHash = await db.checkImgHash(imageProps.hash);
      if(existingHash){
        logger.log(`Image hash found, not awarding win;`);
        message.reply(`Hey, I've seen this image before. Are you trying to game the system there bud?`);
        utils.deleteFile(imageProps.resizedPath);
        return;
      }
      let imgScore = await getImgCompareScore(imageProps.resizedPath);
      let users = discord.getMessageUsers(message);
      let scoreDifference = imgScore - CONFIG.app.IMG_SCORE_THRESHOLD;
      if (imgScore < CONFIG.app.IMG_SCORE_THRESHOLD && imgScore > 0) {
        logger.log(`Compare score looks good (${imgScore}), awarding win.`);
        db.recordHash(message.id, imageProps.hash, message.author.username);
        await discord.winnerWinner(message, users, imageProps.resizedPath, imgScore);
      } else if(scoreDifference <= CONFIG.app.IMG_SCORE_THRESHOLD){
        //if the score differetial is within the THRESHOLD value, try OCR, else it's definitely not a win
        const isWinnerByOCR = await isWinningScreenshot(imageProps.resizedPath);
        if(isWinnerByOCR){
          logger.log(`Compare score too high (${imgScore}) but OCR found Winner Winner Text, awarding win...`);
          db.recordHash(message.id, imageProps.hash, message.author.username);
          await discord.winnerWinner(message, users, imageProps.resizedPath, `${imgScore.toLocaleString()} (OCR)`);
        } else {
          logger.log(`Image score was close (${imgScore}) but OCR did not find a win...`);
          message.react("❓");
          message.react("🤷");
          utils.deleteFile(imageProps.resizedPath);
        }
      } else{
          logger.log(`Compare score out of range (${imgScore}), no win for you!`);
          message.react("❓");
          message.react("🤷");
          utils.deleteFile(imageProps.resizedPath);
      }
    } catch (err) {
      await message.react("💀");
      await message.react("🇭");
      await message.react("🇪");
      await message.react("🇱");
      await message.react("🇵");
      await message.react("‼");
      
      logger.error("discord.js::Error in checkScore try block");
      logger.error(err);
    }
}


module.exports = {
    checkScore
}