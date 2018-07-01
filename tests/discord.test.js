//const logger = require('./lib/log.js');
const expect = require('expect');
const fs = require('fs'); 
const compare = require('../lib/compare.js');
const download = require('../lib/download.js');
const removeFile = require('../lib/utils.js');

describe('Compare.js', () => {
	it('should get compare score > 10,000', (done) => {
		compare('/home/peter/node-discord-bot/tests/unknown.png').then((score) => {
			expect(score).toBeGreaterThan(10000);
			done();
		});
	});
	it('should get compare score < 10,000', (done) => {
		compare('/home/peter/node-discord-bot/tests/unknown720.png').then((score) => {
			expect(score).toBeLessThan(10000);
			done();
		});
	});
});

describe('Download.js', () => {
	it('should download a file', (done) => {
		download('https://peterfiorella.com/img/DinnerBot/dinner.png').then((path) => {
			expect(path).toBe('/home/peter/node-discord-bot/lib/../data/img/downloads/temp.png');
			done();
		});
	});
});

describe('Utils.js', () => {
	it('should delete a file', (done) => {
		removeFile('/home/peter/node-discord-bot/data/img/downloads/temp.png');
		fs.stat('/home/peter/node-discord-bot/data/img/downloads/temp.png', (err, stat) => {
			expect(err.code).toBe('ENOENT');
			done();
		});
	});
});
