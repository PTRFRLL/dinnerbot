const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const mime = require('mime-types');
const axios = require('axios');
const jimp = require('jimp');

const {ALLOWED_EXT} = require('./constants');
const logger = require('./log.js')('utils');

/**
 * async delete file
 * @param {*} filepath 
 * @returns 
 */
const deleteFile = (filepath) => {
	return new Promise((resolve, reject) => {
		fs.unlink(filepath, err => {
			if(err){
				reject(err);
			}
			logger.debug(`File was deleted: ${filepath}`);
			resolve();
		});
	})
};

/**
 * Resizes, adds greyscale and contrast and converts image to PNG
 * @param {*} filepath 
 * @returns converted image filepath
 */
const normalizeImage = async(filepath) => {
	logger.debug(`filepath received: ${filepath}`);
	let extension = path.extname(filepath);
	let filenameNoExt = path.basename(filepath, extension);
	let convertPath = path.join(__dirname, '..', 'data', 'img', `${filenameNoExt}_converted.png`);
	const image = await jimp.read(filepath);
	await image
		.resize(1280, 720)
		.greyscale()
		.contrast(+1)
		.writeAsync(convertPath);
	return convertPath;
}

/**
 * Generates SHA-1 hash of given file
 * @param {*} filePath 
 * @returns SHA1 hash in hex format
 */
const hashFile = (filePath) => {
	return new Promise((resolve, reject) => {
		let hash = crypto.createHash('sha1');
		let stream = fs.createReadStream(filePath);
		stream.on('error', err => reject(err));
		stream.on('data', chunk => hash.update(chunk));
		stream.on('end', () => resolve(hash.digest('hex')));
	});
}

const hashText = (text) => {
	return crypto.createHash('sha1').update(text).digest('hex');
}

/**
 * Downloads given URL provided mime-type is in allowed extension list
 * @param {*} url 
 * @param {*} filename 
 * @returns 
 */
const downloadFile = async(url, filename) => {
	logger.debug(`Downloading: ${url}`);
	const response = await axios({
		method: 'GET',
    	url: url,
    	responseType: 'stream'
	});
	let extension = mime.extension(response.headers['content-type']);
	if(!ALLOWED_EXT.includes(extension)){
		return Promise.reject('Invalid extension, skipping download...');
	}
	let imgPath = path.join(__dirname, '..', 'data', 'img', `${filename}.${extension}`);
	response.data.pipe(fs.createWriteStream(imgPath))

	return new Promise((resolve, reject) => {
	    response.data.on('end', () => {
	    	logger.debug(`File downloaded: ${imgPath}`);
	      	resolve(imgPath)
	    })
	    response.data.on('error', () => {
	      reject()
	    })
  	})
}

/**
 * Downloads image url, normalizes image for comparison and hashes file
 * @param {*} url 
 * @returns 
 */
const getImage = async(url) => {
	try{
		let file = await downloadFile(url, 'temp');
		let resizedPath = await normalizeImage(file);
		let hash = await hashFile(resizedPath);
		deleteFile(file);
		return {resizedPath, hash};
	}catch(err){
		logger.error(err);
	}
}



module.exports = {
	deleteFile,
	normalizeImage,
	hashFile,
	downloadFile,
	getImage,
	hashText
}

