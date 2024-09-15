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
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
  },
});

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
  pets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
    }
  ],
  equipped: {
    type: equippedSchema,
  },
  lastMine: {
    type: Date,
    default: new Date(0),
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
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  value: {
    type: Number,
  },
  command: {
    type: String,
  },
  origin: {
    type: String,
  },
}, { timestamps: true });

const User = db.model('User', userSchema);
const UserPrize = db.model('UserPrize', prizeSchema);

module.exports = { User, UserPrize };

