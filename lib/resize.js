const sharp = require('sharp');
const path = require('path');
const logger = require('./log.js');

module.exports = function (filepath){
	let filename = path.basename(filepath);
	let extension = path.extname(filepath);
	let filenameNoExt = path.basename(filepath, extension);
	let convertPath = __dirname + `/../data/img/convert/${filenameNoExt}.png`;
	return sharp(filepath)
		.resize(1280,720)
		.toFormat('png')
		.toFile(convertPath).then(res => {
			logger.debug(`resize.js::Image resized`);
			return convertPath;
		}).catch((err) => {
			logger.error(`Resize.js:: ${err}`);
		});
};
