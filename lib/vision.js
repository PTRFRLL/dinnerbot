const Tesseract = require('tesseract.js');
const logger = require('./log.js')('vision');


const isWinningScreenshot = async(imagePath) => {
    try{
        logger.debug(`Image path passed to isWinningScreenshot: ${imagePath}`)
        let imageText = await ocr(imagePath);
        logger.debug(`Text returned from OCR: ${imageText}`);
        return imageText.toUpperCase().includes('WINNER WINNER');
    }catch(e){
        logger.error(`Error checking OCR contents ${e}`);
        return false;
    }
    
}

const ocr = async(imgPath) => {
    try{
        const result = await Tesseract.recognize(imgPath,'eng');
        return result.data.text;
    }catch(err){
        logger.error(`Error OCRing image`, err);
        return '';
    }
}

module.exports = {
    isWinningScreenshot,
    ocr
}