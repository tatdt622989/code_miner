const mongoose = require('mongoose');

const db = mongoose.createConnection(`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB_NAME}`)

const reisuiDb = mongoose.createConnection(`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB_NAME2}`)

// 監聽連接
db.once('open', () => {
  console.log('db connected');
});
reisuiDb.once('open', () => {
  console.log('reisuiDb connected');
});

// 監聽錯誤
db.on('error', console.error.bind(console, 'connection error:'));
reisuiDb.on('error', console.error.bind(console, 'connection error:'));

module.exports = {
  db,
  reisuiDb
};
