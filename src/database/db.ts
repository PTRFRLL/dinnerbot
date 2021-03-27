import Sequelize from 'sequelize';
import logger from '../lib/logger';

import {UserModel} from './models/User';

let sequelize;

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;