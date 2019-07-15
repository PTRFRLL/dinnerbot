const expect = require('expect');
const fs = require('fs');
const compare = require('../lib/compare.js');
const {resize, download, deleteFile, hashFile} = require('../lib/utils.js');
const score = require('../lib/score.js');
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

describe('Hash', () => {
	it('should create a hash', (done) => {
		hashFile(__dirname + '/../tests/unknown720.png').then((hash) => {
			expect(hash).toBeA('string');
			expect(hash).toEqual('698d20f1bdf30be65718c3a909180a4bed261fc4');
			done();
		})
	});
})

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
		deleteFile(path_converted);
		deleteFile(path_og);
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
		deleteFile(path);
		fs.stat(path, (err, stat) => {
			expect(err.code).toBe('ENOENT');
			done();
		});
	});
});