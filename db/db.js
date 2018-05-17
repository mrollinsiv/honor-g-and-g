const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const dbConfig = require('../config/db');

const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.adapter,
  logging: false,
});

const db = {};
fs
  .readdirSync(`${__dirname}/../models`)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== 'index.js'))
  .forEach((file) => {
    const model = sequelize.import(path.join(`${__dirname}/../models`, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.sequelize.sync();

module.exports = db;
