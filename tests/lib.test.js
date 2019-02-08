const expect = require('expect');
const fs = require('fs');
const compare = require('../lib/compare.js');
const download = require('../lib/download.js');
const removeFile = require('../lib/utils.js');
const score = require('../lib/score.js');
const resize = require('../lib/resize');
const imageSize = require('image-size');

describe('Download/Resize', () => {
	it('should download a file and resize it to 1280x720', (done) => {
		download('https://cdn.discordapp.com/attachments/316374943782666241/463749503967559712/Nofly.jpg').then((path) => {
			expect(fs.existsSync(path)).toBe(true);
			resize(path).then(resized => {
				expect(fs.existsSync(resized)).toBe(true);
				let dimensions = imageSize(resized);
				expect(dimensions.height).toBe(720);
				expect(dimensions.width).toBe(1280);
				done();
			});
		});
	});
});

describe('Compare.js', () => {
	it('should get compare score > 10,000', (done) => {
		compare(__dirname + '/../tests/unknown.png').then((score) => {
			expect(score).toBeGreaterThan(10000);
			done();
		});
	});
	it('should get compare score < 10,000', (done) => {
		compare(__dirname + '/../tests/unknown720.png').then((score) => {
			expect(score).toBeLessThan(10000);
			done();
		});
	});
	it('should get winning compare score (< 10000)', (done) => {
		compare(__dirname + '/../data/img/temp_converted.png').then((score) => {
			expect(score).toBeLessThan(10000);
			done();
		});
	});
	after(function() {
		let path_converted = __dirname + '/../data/img/temp_converted.png';
		let path_og = __dirname + '/../data/img/temp.jpeg';
		removeFile(path_converted);
		removeFile(path_og);
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


describe('Score.js', () => {
	it('should return a valid score (~6500) for win attachment url', (done) => {
		score.getScore('https://cdn.discordapp.com/attachments/316374943782666241/463749503967559712/Nofly.jpg').then((score) => {
			expect(score).toBeGreaterThan(6000);
			expect(score).toBeLessThan(7000);
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