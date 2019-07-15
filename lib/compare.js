var fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelmatch = require('pixelmatch');
const logger = require('./log.js');

const compare = (pathToImage) => {
	return new Promise((resolve, reject) => {
		logger.debug(`compare.js::Image recieved ${pathToImage}`);
		if(pathToImage === ''){
			reject(new Error);
		}
		const base = fs.createReadStream(__dirname + '/../data/img/base.png').pipe(new PNG())
			.on('parsed', doneReading)
			.on('data', () => {
	    		base.destroy();
	    	})
	    const test = fs.createReadStream(pathToImage).pipe(new PNG())
	    	.on('parsed', doneReading)
	    	.on('data', () => {
	    		test.destroy();
	    	})
	    let filesRead = 0;

		function doneReading() {
		    if (++filesRead < 2) return;
		    var diff = new PNG({width: base.width, height: base.height});

		    let res = pixelmatch(base.data, test.data, diff.data, base.width, base.height, {threshold: 0.5});
		    logger.debug(`compare.js::Comparison score: ${res}`)
		    resolve(res);
		}
	});
};

module.exports = compare;