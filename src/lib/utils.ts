import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

import mime from 'mime-types';
import axios from 'axios';
import jimp from 'jimp';

import logger from './logger';
import { ImageProps } from '../types';


/**
 * async delete file
 * @param {*} filepath 
 * @returns 
 */
export const deleteFile = (filepath: string) : Promise<boolean> => {
	return new Promise((resolve, reject) => {
		fs.unlink(filepath, err => {
			if(err){
				reject(err);
			}
			logger.debug(`Utils.js::File was deleted: ${filepath}`);
			resolve(true);
		});
	})
};

/**
 * Resizes, adds greyscale and contrast and converts image to PNG
 * @param {*} filepath 
 * @returns converted image filepath
 */
export const normalizeImage = async(filepath: string) => {
	logger.debug(`normalizeImage::filepath received: ${filepath}`);
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
export const hashFile = (filePath: string) : Promise<string> => {
	return new Promise((resolve, reject) => {
		let hash = crypto.createHash('sha1');
		let stream = fs.createReadStream(filePath);
		stream.on('error', err => reject(err));
		stream.on('data', chunk => hash.update(chunk));
		stream.on('end', () => resolve(hash.digest('hex')));
	});
}

/**
 * Downloads given URL provided mime-type is in allowed extension list
 * @param {*} url 
 * @param {*} filename 
 * @returns 
 */
export const downloadFile = async(url: string, filename: string): Promise<string> => {
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

/**
 * Downloads image url, normalizes image for comparison and hashes file
 * @param {*} url 
 * @returns 
 */
export const getImage = async(url: string): Promise<ImageProps> => {
	try{
		let file = await downloadFile(url, 'temp');
		let resizedPath = await normalizeImage(file);
		let hash = await hashFile(resizedPath);
		deleteFile(file);
		return {path: resizedPath, hash};
	}catch(err){
		logger.error(err);
	}
}