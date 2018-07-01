//const logger = require('./lib/log.js');
const expect = require('expect');
const fs = require('fs'); 
const compare = require('../lib/compare.js');
const download = require('../lib/download.js');
const removeFile = require('../lib/utils.js');

describe('Compare.js', () => {
	it('should get compare score > 10,000', (done) => {
		compare(__dirname + '/../tests/unknown.png').then((score) => {
			expect(score).toBeGreaterThan(10000);
			done();
		});
	});
	it('should get compare score < 10,000', (done) => {
		compare(__dirname+ '/../tests/unknown720.png').then((score) => {
			expect(score).toBeLessThan(10000);
			done();
		});
	});
});

describe('Download.js', () => {
	it('should download a file', (done) => {
		download('https://peterfiorella.com/img/DinnerBot/dinner.png').then((path) => {
			expect(fs.existsSync(path)).toBe(true);
			done();
		});
	});
});

describe('Utils.js', () => {
	it('should delete a file', (done) => {
		let path = __dirname + '/../data/img/temp.png';
		removeFile(path);
		fs.stat(path, (err, stat) => {
			expect(err.code).toBe('ENOENT');
			done();
		});
	});
});
