const os = require('os');
process.env.DATA_PATH = process.env.DATA_PATH || os.tmpdir();

const expect = require('expect');
const sinon = require('sinon');
const axios = require('axios');

const PLAYER_ID = 'account.test';

/**
 * Build a minimal PUBG match response
 */
const buildMatch = (id, rank, matchType = 'official') => ({
	data: {
		data: {
			id,
			attributes: {duration: 1800, gameMode: 'squad-fpp', matchType, createdAt: '2026-11-02T22:00:00Z', mapName: 'Chimera_Main'}
		},
		included: [
			{type: 'participant', id: 'p1', attributes: {stats: {playerId: PLAYER_ID, name: 'icei', kills: 5, timeSurvived: 1700}}},
			{type: 'roster', id: 'r1', attributes: {stats: {rank}}, relationships: {participants: {data: [{id: 'p1'}]}}}
		]
	}
});

const connReset = () => Object.assign(new Error('read ECONNRESET'), {code: 'ECONNRESET'});

describe('PUBG', () => {
	let get, pubg, clock;

	beforeEach(() => {
		get = sinon.stub();
		sinon.stub(axios, 'create').returns({get});
		delete require.cache[require.resolve('../lib/pubg')];
		pubg = require('../lib/pubg');
		axios.create.restore();
		clock = sinon.useFakeTimers();
	});

	afterEach(() => {
		clock && clock.restore();
		axios.create.restore && axios.create.restore();
	});

	const withMatches = (ids) => {
		get.withArgs(`players/${PLAYER_ID}`).resolves({
			data: {data: {id: PLAYER_ID, relationships: {matches: {data: ids.map(id => ({id}))}}}}
		});
	};

	describe('getLatestWin', () => {
		it('should return the most recent official win', async () => {
			withMatches(['m1', 'm2', 'm3']);
			get.withArgs('matches/m1').resolves(buildMatch('m1', 4));
			get.withArgs('matches/m2').resolves(buildMatch('m2', 1, 'custom'));
			get.withArgs('matches/m3').resolves(buildMatch('m3', 1));
			const win = await pubg.getLatestWin(PLAYER_ID);
			expect(win.matchId).toBe('m3');
			expect(win.map).toBe('Paramo');
		});

		it('should stop fetching matches once a win is found', async () => {
			const ids = Array.from({length: 50}, (_, i) => `m${i}`);
			withMatches(ids);
			ids.forEach(id => get.withArgs(`matches/${id}`).resolves(buildMatch(id, id === 'm0' ? 1 : 10)));
			const win = await pubg.getLatestWin(PLAYER_ID);
			expect(win.matchId).toBe('m0');
			//player lookup + first batch only
			expect(get.callCount).toBeLessThan(10);
		});

		it('should retry a match request after a connection reset', async () => {
			withMatches(['m1']);
			get.withArgs('matches/m1')
				.onFirstCall().rejects(connReset())
				.onSecondCall().resolves(buildMatch('m1', 1));
			const promise = pubg.getLatestWin(PLAYER_ID);
			await clock.runAllAsync();
			const win = await promise;
			expect(win.matchId).toBe('m1');
		});

		it('should give up after repeated connection resets', async () => {
			withMatches(['m1']);
			get.withArgs('matches/m1').rejects(connReset());
			const promise = pubg.getLatestWin(PLAYER_ID);
			const assertion = expect(promise).rejects.toThrow('ECONNRESET');
			await clock.runAllAsync();
			await assertion;
			expect(get.withArgs('matches/m1').callCount).toBe(3);
		});

		it('should not retry non-transient errors', async () => {
			withMatches(['m1']);
			get.withArgs('matches/m1').rejects(Object.assign(new Error('Not Found'), {response: {status: 404}}));
			await expect(pubg.getLatestWin(PLAYER_ID)).rejects.toThrow('Not Found');
			expect(get.withArgs('matches/m1').callCount).toBe(1);
		});
	});
});
