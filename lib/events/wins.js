const {winnerWinner, getMessageUsers} = require('../discord');

const {deleteFile, getImage} = require("../utils");
const {recordHash, checkImgHash} = require("../db_utils");
const logger = require('../log');
const {isWinningScreenshot} = require("../vision");
const getImgCompareScore = require('../compare');
const {IMG_SCORE_THRESHOLD} = require('../constants');


const checkScore = async(imgPath) => {
  let isWin = false;
  let isOCR = false;
  let score = await getImgCompareScore(imgPath);
  let scoreDifference = score - IMG_SCORE_THRESHOLD;
  if (score < IMG_SCORE_THRESHOLD && score > 0) {
    logger.log(`Compare score looks good (${score}), awarding win.`);
    isWin = true;
  } else if(scoreDifference <= IMG_SCORE_THRESHOLD){
    //if the score differetial is within the THRESHOLD value, try OCR, else it's definitely not a win
    const isWinnerByOCR = await isWinningScreenshot(imgPath);
    if(isWinnerByOCR){
      logger.log(`Compare score too high (${score}) but OCR found Winner Winner Text, awarding win...`);
      isWin = true;
      isOCR = true;
    } else {
      logger.log(`Image score was close (${score}) but OCR did not find a win...`);
    }
  } else{
      logger.log(`Compare score out of range (${score}), no win for you!`);
  }
  return {
    score,
    isOCR,
    isWin
  };
}

const isExistingImage = async(hash) => {
  const existingHash = await checkImgHash(hash);
  if(existingHash){
    logger.log(`Image hash found, not awarding win`);
    return true;
  }
  return false;
}

const determineWin = async(url, message) => {
    try {
      let {hash, resizedPath} = await getImage(url);
      const existingHash = await isExistingImage(hash);
      if(existingHash){
        message.reply(`Hey, I've seen this image before. Are you trying to game the system there bud?`);
        deleteFile(resizedPath);
        return;
      }
      const {isWin, isOCR, score} = await checkScore(resizedPath);
      if(isWin){
        await recordHash(message.id, hash, message.author.username);
        let displayScored = score;
        if(isOCR){
          displayScored = `${score.toLocaleString()} (OCR)`;
        }
        let users = getMessageUsers(message);
        await winnerWinner(message, users, resizedPath, displayScored);
      }else{
        message.react("❓");
        message.react("🤷");
        deleteFile(resizedPath);
      }
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