const fs = require('fs');
const logger = require('./log.js');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const mime = require('mime-types');
let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../config');
}
const jimp = require('jimp');

const deleteFile = (filepath) => {
	return new Promise((resolve, reject) => {
		fs.unlink(filepath, err => {
			if(err){
				reject(err);
			}
			logger.debug(`Utils.js::File was deleted: ${filepath}`);
			resolve();
		});
	})
};

const resize = async(filepath) => {
	logger.debug(`Resize.js::filepath received: ${filepath}`);
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

const hashFile = (filePath) => {
	return new Promise((resolve, reject) => {
		let hash = crypto.createHash('sha1');
		let stream = fs.createReadStream(filePath);
		stream.on('error', err => reject(err));
		stream.on('data', chunk => hash.update(chunk));
		stream.on('end', () => resolve(hash.digest('hex')));
	});
}

const download = async (url, filename) => {
	const response = await axios({
		method: 'GET',
    	url: url,
    	responseType: 'stream'
	});
	let extension = mime.extension(response.headers['content-type']);
	if(!CONFIG.app.ALLOWED_EXT.includes(extension)){
		return Promise.reject('Invalid extension, skipping download...');
	}
	let imgPath = path.join(__dirname, '..', 'data', 'img', `${filename}.${extension}`);
	response.data.pipe(fs.createWriteStream(imgPath))

	return new Promise((resolve, reject) => {
	    response.data.on('end', () => {
	    	logger.debug(`Download.js::File downloaded: ${imgPath}`);
	      	resolve(imgPath)
	    })
	    response.data.on('error', () => {
	      reject()
	    })
  	})
}

const getImage = async(url) => {
	try{
		let file = await download(url, 'temp');
		let resizedPath = await resize(file);
		let hash = await hashFile(resizedPath);
		deleteFile(file);
		return {resizedPath, hash};
	}catch(err){
		logger.error(err);
	}
}

module.exports = {
	deleteFile,
	resize,
	hashFile,
	download,
	getImage
}

