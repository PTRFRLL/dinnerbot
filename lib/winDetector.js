const { getImage } = require("./utils");
const logger = require("./log");
const { checkImgHash } = require("./db_utils");
const getImgCompareScore = require('./compare');
const {isWinningScreenshot} = require("./vision");
const {IMG_SCORE_THRESHOLD} = require('./constants');

class WinDetector{
    constructor(url){
        this.url = url;
        this.isWin = false;
        this.isOCR = false;
        this.imageAlreadyExists = false;
    }

    get formattedScore(){
        let score = this.score.toLocaleString();
        if(this.isOCR){
            score += ' (OCR)'
        }
        return score;
    }

    /**
     * Main logic to determine if supplied image is winning screenshot
     */
    async determineWin(){
        try{
            let {hash, resizedPath} = await getImage(this.url);
            this.imgPath = resizedPath;
            this.imgHash = hash;
            await this.isExistingImage(hash);
            await this.checkScore();
        }catch(err){
            logger.error(err);
        }
    }

    /**
     * Determine if image similarity score OR OCR constitutes a win
     * @returns 
     */
    async checkScore(){
        if(this.imageAlreadyExists) return;
        this.score = await getImgCompareScore(this.imgPath);
        let scoreDifference = this.score - IMG_SCORE_THRESHOLD;
        if (this.score < IMG_SCORE_THRESHOLD && this.score > 0) {
            logger.info(`Compare score looks good (${this.score}), awarding win.`);
            this.isWin = true;
        } else if(scoreDifference <= IMG_SCORE_THRESHOLD){
          //if the score differetial is within the THRESHOLD value, try OCR, else it's definitely not a win
            const isWinnerByOCR = await isWinningScreenshot(this.imgPath);
            if(isWinnerByOCR){
                logger.info(`Compare score too high (${this.score}) but OCR found Winner Winner Text, awarding win...`);
                this.isWin = true;
                this.isOCR = true;
            } else {
                logger.info(`Image score was close (${this.score}) but OCR did not find a win...`);
            }
        } else{
            logger.info(`Compare score out of range (${this.score}), no win for you!`);
        }
    }

    /**
     * Checks DB for existance of hash
     * @param {*} hash 
     */
    async isExistingImage(hash){
        const existingHash = await checkImgHash(hash);
        if(existingHash){
            logger.info(`Image hash found in DB`);
            this.imageAlreadyExists = true;
            this.isWin = false;
        }
    }
}

module.exports = WinDetector;