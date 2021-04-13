require('../config/config')
const expect = require('expect');
const path = require('path');
const fs = require('fs');
const { setupDatabase, userOne, hashOne, userTwo, userThree } = require('./fixtures/db');
const { getUserByDiscordId, checkImgHash, recordHash, updatePlayerUsername, findPUBGUserFromList, logUserWins, adjustUserWins, getWins } = require('../lib/db_utils');

beforeEach(setupDatabase);

describe('Database', () => {
	describe('getUserByDiscordId', () => {
		it('should return User', (done) => {
			getUserByDiscordId(userOne.discord_id).then((user) => {
                expect(user.username).toEqual(userOne.username);
				done();
			});
		});
        it('should return null', (done) => {
			getUserByDiscordId('INVALID_ID').then((user) => {
                expect(user).toBeNull();
				done();
			});
		});
	});
    describe('checkImgHash', () => {
		it('should find existing hash', (done) => {
			checkImgHash(hashOne.hash).then((doesExist) => {
                expect(doesExist).toBe(true);
				done();
			});
		});
        it('should not find existing hash', (done) => {
			checkImgHash('INVALID_ID').then((doesExist) => {
                expect(doesExist).toBe(false);
				done();
			});
		});
	});
    describe('recordHash', () => {
		it('should add a new hash record', (done) => {
			recordHash('12345', hashOne.hash, userOne.username).then((record) => {
                expect(record.hash).toEqual(hashOne.hash);
                expect(record.username).toEqual(userOne.username);
				done();
			});
		});
	});
    describe('updatePlayerUsername', () => {
		it('should update existing user with PUBG username', (done) => {
            let user = {
                id: userOne.discord_id,
                username: userOne.username,
                PUBG_Username: 'wackyjacky101',
                PUBGID: userOne.pubg_id
            };
			updatePlayerUsername(user, user.PUBG_Username, user.PUBGID).then((dbUser) => {
                expect(dbUser.pubg_username).toEqual(user.PUBG_Username);
				done();
			});
		});
        it('should add new user with PUBG username', (done) => {
            let user = {
                id: '9834534',
                username: 'NEWUSER',
                PUBG_Username: 'wackyjacky101',
                PUBGID: 'account.1234567'
            };
			updatePlayerUsername(user, user.PUBG_Username, user.PUBGID).then((dbUser) => {
                expect(dbUser.pubg_username).toEqual(user.PUBG_Username);
                expect(dbUser.username).toEqual(user.username);
                expect(dbUser.wins).toEqual(0);
				done();
			});
		});
	});
    describe('findPUBGUserFromList', () => {
		it('should find user with PUBG ID', (done) => {
            let list = [userOne.discord_id, userTwo.discord_id];
			findPUBGUserFromList(list).then((record) => {
                expect(record.pubg_id).toEqual(userOne.pubg_id);
                expect(record.username).toEqual(userOne.username);
				done();
			});
		});
        it('should NOT find user with PUBG ID', (done) => {
            let list = [userTwo.discord_id];
			findPUBGUserFromList(list).then((record) => {
                expect(record).toBeNull();
				done();
			});
		});
	});
    describe('logUserWins', () => {
		it('should increment all users wins by one', (done) => {
            const newUser = {
                id: '1123123123',
                username: 'NEWUSER' 
            };
            const users = [
                {
                    id: userOne.discord_id,
                    username: userOne.username
                },
                {
                    id: userTwo.discord_id,
                    username: userTwo.username
                },
                newUser
            ];
			logUserWins(users).then((records) => {
                const dbUserOne = records.find(record => record.discord_id === userOne.discord_id);
                const dbUserTwo = records.find(record => record.discord_id === userTwo.discord_id);
                const newDbUser = records.find(record => record.discord_id === newUser.id);
                expect(dbUserOne.wins).toEqual(6);
                expect(dbUserTwo.wins).toEqual(2);
                expect(newDbUser.wins).toEqual(1);
                expect(newDbUser.username).toEqual(newUser.username);
				done();
			});
		});
	});
    describe('adjustUserWins', () => {
		it('should increment all users wins by 5', (done) => {
            const newUser = {
                id: '1123123123',
                username: 'NEWUSER' 
            };
            const users = [
                {
                    id: userOne.discord_id,
                    username: userOne.username
                },
                {
                    id: userTwo.discord_id,
                    username: userTwo.username
                },
                newUser
            ];
			adjustUserWins(users, 5).then((records) => {
                const dbUserOne = records.find(record => record.discord_id === userOne.discord_id);
                const dbUserTwo = records.find(record => record.discord_id === userTwo.discord_id);
                const newDbUser = records.find(record => record.discord_id === newUser.id);
                expect(dbUserOne.wins).toEqual(10);
                expect(dbUserTwo.wins).toEqual(6);
                expect(newDbUser.wins).toEqual(5);
                expect(newDbUser.username).toEqual(newUser.username);
				done();
			})
		});
	});
    describe('getWins', () => {
		it('should return user records', (done) => {
            const newUser = {
                id: '1123123123',
                username: 'NEWUSER' 
            };
            const users = [
                {
                    id: userOne.discord_id,
                    username: userOne.username
                },
                {
                    id: userTwo.discord_id,
                    username: userTwo.username
                },
                newUser
            ];
			getWins(users).then((records) => {
                expect(records.length).toEqual(3);
                const dbUserOne = records.find(record => record.discord_id === userOne.discord_id);
                const dbUserTwo = records.find(record => record.discord_id === userTwo.discord_id);
                const newDbUser = records.find(record => record.username === newUser.username);
                expect(dbUserOne.wins).toEqual(5); 
                expect(dbUserTwo.wins).toEqual(1);
                expect(newDbUser.wins).toBeFalsy();
                expect(newDbUser.username).toEqual(newUser.username);
				done();
			});
		});
	});
});