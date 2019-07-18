const fs = require('fs');
const logger = require('./log.js');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const mime = require('mime-types');
const CONFIG = require('../config')

const deleteFile = (path) => {
	return new Promise((resolve, reject) => {
		fs.unlink(path, err => {
			if(err){
				reject(err);
			}
			logger.debug(`Utils.js::File was deleted: ${path}`);
			resolve();
		});
	})
};


const resize =  (filepath) => {
	logger.debug(`Resize.js::filepath received: ${filepath}`);
	let extension = path.extname(filepath);
	let filenameNoExt = path.basename(filepath, extension);
	let convertPath = __dirname + `/../data/img/${filenameNoExt}_converted.png`;
	sharp.cache(false);
	return sharp(filepath)
		.resize(1280,720)
		.toFormat('png')
		.toFile(convertPath).then(res => {
			logger.debug(`resize.js::Image resized: ${convertPath}`);
			return convertPath;
		}).catch((err) => {
			logger.error(`Resize.js:: ${err}`);
		});
};

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
	let path = __dirname + `/../data/img/${filename}.${extension}`;
	response.data.pipe(fs.createWriteStream(path))

	return new Promise((resolve, reject) => {
	    response.data.on('end', () => {
	    	logger.debug(`Download.js::File downloaded: ${path}`);
	      	resolve(path)
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

