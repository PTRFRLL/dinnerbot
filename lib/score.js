const resize = require('./resize.js');
const compare = require('./compare.js');
const fs = require('fs');
const download = require('./download.js');
const logger = require('./log.js');
const removeFile = require('./utils.js');

module.exports = {
	getScore: function(url){
		return new Promise((resolve, reject) => {
			download(url).then(file => {
				resize(file).then(res => {
				//compare with BASE image (a known win)
					compare(res).then(score => {
						//logger(`Compare score: ${score}`);
						resolve(score);
						fs.unlink(res, err => {
							if(err){
								console.log(err);
							}
						});
						fs.unlink(file, err => {
							if(err){
								console.log(err);
							}
						});
					}).catch(err => {
						logger.log('score.js::Error comparing images');
					});
				}).catch(err => {
					logger.log('score.js::Error resizing image');
				});
			}).catch(err => {
				logger.log('score.js::Error downloading file');
			});
		});
	},
	getScoreAsync: async function(url){
		const file = await download(url);
		const resizedPath = await resize(file);
		const score = await compare(resizedPath);
		removeFile(file);
		removeFile(resizedPath);
		return score;
	}
};



