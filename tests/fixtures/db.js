const db = require('../../lib/db');

const userOne = {
    username: 'pfry',
    discord_id: '144142948622139393',
    wins: 5,
    pubg_username: 'THUNDERCOUGARFALCONBIRD',
    pubg_id: 'account.6f3ab2a42b2a4475bad391e037adba82'
};

const userTwo = {
    username: 'drzoidberg',
    discord_id: '468543548964654',
    wins: 1
};

const userThree = {
    username: 'tleela',
    discord_id: '144142948622134684',
    wins: 5,
    pubg_username: 'ONEBDEYE',
    pubg_id: 'account.6f3ab4a42b3a4475bad391e037badc27'
};

const hashOne = {
    message_id: '',
    hash: 'f0c343136ee4de36ffc821aa9cc2868ecb1125ff',
    username: userOne.username
}


const setupDatabase = async () => {
    await db.sequelize.sync();
    await db.user.truncate();
    await db.hash.truncate();
    await db.user.create(userOne);
    await db.user.create(userTwo);
    await db.user.create(userThree);
    await db.hash.create(hashOne);
}

module.exports = {
    setupDatabase,
    userOne,
    userTwo,
    hashOne
}