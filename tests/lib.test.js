const expect = require('expect');
const path = require('path');
const fs = require('fs');
const http = require('http');
const compare = require('../lib/compare.js');
const {normalizeImage, downloadFile, deleteFile, hashFile, getImage, hashText} = require('../lib/utils.js');
const imageSize = require('image-size');
const {ocr} = require('../lib/vision');
const {winningPresence} = require('./fixtures/presence')

describe('Utils', () => {
	//serve fixtures locally so download tests don't depend on an external site
	let server, baseUrl;
	before((done) => {
		server = http.createServer((req, res) => {
			if(req.url === '/dinner.png'){
				res.writeHead(200, {'Content-Type': 'image/png'});
				fs.createReadStream(path.join(__dirname, '..', 'examples', 'main.png')).pipe(res);
			}else{
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('<html></html>');
			}
		}).listen(0, () => {
			baseUrl = `http://localhost:${server.address().port}`;
			done();
		});
	});
	after((done) => {
		server.close(done);
	});

	describe('Download', () => {
		it('should download a file', (done) => {
			downloadFile(`${baseUrl}/dinner.png`, 'test').then((filepath) => {
				expect(fs.existsSync(filepath)).toBe(true);
				done();
			}).catch(done);
		});
		it('should NOT download a not allowed extension', (done) => {
			downloadFile(baseUrl).then((filepath) => {
				throw new Error('File downloaded');
			}).catch((e) => {
				expect(e).toEqual('Invalid extension, skipping download...')
				done();
			});
		});
	});
	describe('normalizeImage', () => {
		it('should normalize the image', (done) => {
			downloadFile(`${baseUrl}/dinner.png`, 'testTwo').then((filepath) => {
				expect(fs.existsSync(filepath)).toBe(true);
				return normalizeImage(filepath).then(resized => {
					expect(fs.existsSync(resized)).toBe(true);
					let dimensions = imageSize(resized);
					expect(dimensions.height).toBe(720);
					expect(dimensions.width).toBe(1280);
					done();
				});
			}).catch(done);
		});
	});
	describe('Hash File', () => {
		it('should create a hash of file', (done) => {
			let filePath = path.join(__dirname, 'unknown720.png');
			hashFile(filePath).then((hash) => {
				expect(typeof hash).toBe('string');
				expect(hash).toEqual('f0c343136ee4de36ffc821aa9cc2868ecb1125ff');
				done();
			}).catch(err => {
				console.error(err);
				done();
			})
		});
	});
	describe('Hash Text', () => {
		it('should create a hash of text', () => {
			const PUBG = winningPresence.activities.shift();
			const details = PUBG.details;
			const state = PUBG.state;
			const partySize = PUBG.party.size.join();
			let hash = hashText(details + state + partySize);
			expect(typeof hash).toBe('string');
			expect(hash).toEqual('47d590c8f426dce5371729c881be59934272fdd8');
		});
	});
	describe('Delete', () => {
		it('should delete a file', (done) => {
			let filePath = path.join(__dirname, '..', 'data', 'img', 'testTwo.png')
			expect(fs.existsSync(filePath)).toBe(true);
			deleteFile(filePath).then(() => {
				fs.stat(filePath, (err, stat) => {
					expect(err.code).toBe('ENOENT');
					done();
				});
			});
			
		});
	});
});


describe('Compare.js', () => {
	it('should get compare score > 10,000', (done) => {
		compare(path.join(__dirname, 'fail.png')).then((score) => {
			expect(score).toBeGreaterThan(10000);
			done();
		});
	});
	it('should get compare score < 10,000', (done) => {
		compare(path.join(__dirname, 'unknown720.png')).then((score) => {
			expect(score).toBeLessThan(10000);
			done();
		});
	});
});

describe('OCR', () => {
	it('should get WINNER WINNER text from image', function(done){
		this.timeout(0);
		ocr(path.join(__dirname, 'fail.png')).then((text) => {
			expect(text).toContain('WINNER WINNER');
			done();
		});
	});
})

describe('Complete Logic', () => {
	it('should download image, resize, compare and delete from url', async() => {
		let imageProps = await getImage('https://raw.githubusercontent.com/PTRFRLL/dinnerbot/master/tests/unknown720.png');
		expect(typeof imageProps).toBe('object');
		expect(imageProps.hash).toEqual('2192a77310cd6c4c2d353521e9c74319c80c3030');
		let score = await compare(imageProps.resizedPath);
		expect(score).toBeLessThan(10000);
		await deleteFile(imageProps.resizedPath);
		fs.stat(imageProps.resizedPath, (err, stat) => {
			expect(err.code).toBe('ENOENT');
		});
	});
});

after(() => {
	deleteFile(path.join(__dirname, '..', 'data', 'img', 'test.png'));
	deleteFile(path.join(__dirname, '..', 'data', 'img', 'testTwo_converted.png'));
	deleteFile(path.join(__dirname, '..', 'data', 'img', 'temp_converted.png'));
})
