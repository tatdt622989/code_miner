const mongoose = require('mongoose');
const { db, reisuiDb } = require('../dbConnections');

// 玩家裝備
const equippedSchema = new mongoose.Schema({
  tool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
  },
  mine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mine',
  },
});

// 玩家礦石
// const userMineralsSchema = new mongoose.Schema({
//   num: {
//     type: Number,
//     default: 0,
//   },
//   mineral: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Mineral',
//   }
// });

// 玩家
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  discordId: {
    type: String,
    required: true,
    unique: true,
  },
  experience: {
    type: Number,
    default: 0,
  },
  currency: {
    type: Number,
    default: 0,
  },
  raffleTicket: {
    type: Number,
    default: 0,
  },
  tools: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tool',
    }
  ],
  mines: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mine',
    }
  ],
  // minerals: [{
  //   type: userMineralsSchema,
  // }],
  equipped: {
    type: equippedSchema,
  },
}, { timestamps: true });

// 獎品紀錄
const prizeSchema = new mongoose.Schema({
  prize: {
		type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize',
  },
  code: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

const User = db.model('User', userSchema);
const UserPrize = reisuiDb.model('UserPrize', prizeSchema);

module.exports = { User, UserPrize };

