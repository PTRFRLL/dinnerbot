let env = process.env.NODE_ENV || 'dev';

//set env variables from JSON file
if(env === 'dev' || env === 'test'){
    let config = require('./config.json');
    let envConfig = config[env];
    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key];
    });
}