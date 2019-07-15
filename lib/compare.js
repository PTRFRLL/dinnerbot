var fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelmatch = require('pixelmatch');
const logger = require('./log.js');

const compare = (pathToImage) => {
	return new Promise((resolve, reject) => {
		try{
			const base = PNG.sync.read(fs.readFileSync(__dirname + '/../data/img/base.png'));
			const test = PNG.sync.read(fs.readFileSync(pathToImage));
			const {width, height} = base;
			const diff = new PNG({width, height});
			let res = pixelmatch(base.data, test.data, diff.data, width, height, {threshold: 0.5});
			logger.debug(`Compare score: ${res}`)
			resolve(res);
		}catch(e){
			logger.error(`Compare.js:: ${e}`);
			reject(e);
		}
	});
}

module.exports = compare;