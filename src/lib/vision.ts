import Tesseract from 'tesseract.js';
import logger from './logger';


export const isWinningScreenshot = async(imagePath: string) => {
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

export const ocr = async(imgPath: string) => {
    try{
        const result = await Tesseract.recognize(imgPath,'eng');
        return result.data.text;
    }catch(err){
        logger.error(`Failed to OCR image: ${JSON.stringify(err)}`);
        return '';
    }
}