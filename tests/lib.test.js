const expect = require('expect');
const fs = require('fs');
const compare = require('../lib/compare.js');
const {resize, download, deleteFile, hashFile, getImage} = require('../lib/utils.js');
const score = require('../lib/score.js');
const imageSize = require('image-size');


describe('Utils', () => {
	describe('Download', () => {
		it('should download a file', (done) => {
			download('https://peterfiorella.com/img/DinnerBot/dinner.png', 'test').then((path) => {
				expect(fs.existsSync(path)).toBe(true);
				done();
			});
		});
		it('should NOT download a not allowed extension', (done) => {
			download('https://peterfiorella.com').then((path) => {
				throw new Error('File downloaded');
			}).catch((e) => {
				expect(e).toEqual('Invalid extension, skipping download...')
				done();
			});
		});
	});
	describe('Resize', () => {
		it('should resize an image to 720p', (done) => {
			download('https://peterfiorella.com/img/DinnerBot/dinner.png', 'testTwo').then((path) => {
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
	});
	describe('Delete', () => {
		it('should delete a file', (done) => {
			let filePath = __dirname + '/../data/img/testTwo.png';
			expect(fs.existsSync(filePath)).toBe(true);
			deleteFile(filePath);
			fs.stat(filePath, (err, stat) => {
				expect(err.code).toBe('ENOENT');
				done();
			});
		});
	});
});


describe('Compare.js', () => {
	it('should get compare score > 10,000', (done) => {
		compare(__dirname + '/../tests/fail.png').then((score) => {
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
});

describe('Complete Logic', () => {
	it('should download image, resize, compare and delete from url', (done) => {
		getImage('https://peterfiorella.com/img/DinnerBot/Nofly.jpg').then((imageProps) => {
			expect(imageProps).toBeAn('object');
			expect(imageProps.hash).toEqual('826e9fd4a9fbc44ccb444ccd2bfe2d449df2c76d');
			compare(imageProps.resizedPath).then((score) => {
				expect(score).toBeLessThan(10000);
				deleteFile(imageProps.resizedPath).then(() => {
					fs.stat(imageProps.resizedPath, (err, stat) => {
						expect(err.code).toBe('ENOENT');
						done();
					});
				});
			})
		});
	});
});

after(() => {
	deleteFile(__dirname + '/../data/img/test.png');
	deleteFile(__dirname + '/../data/img/testTwo_converted.png');
})
