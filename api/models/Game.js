const mongoose = require('mongoose');
const { db, reisuiDb } = require('../dbConnections');

const mineralSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	value: {
		type: Number,
		required: true,
	},
	emojiId: {
		type: String,
		required: true,
	},
	emojiName: {
		type: String,
		required: true,
	},
	exp: {
		type: Number,
		required: true,
	},
});

// 礦場底下的礦石資訊
const mineMineralSchema = new mongoose.Schema({
	mineral: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Mineral',
	},
	rarity: {
		type: Number,
		required: true,
	},
	baseMaxDropAmount: {
		type: Number,
		required: true,
	},
});

const mineSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	levelRequirement: {
		type: Number,
		required: true,
		default: 1,
	},
	price: {
		type: Number,
		required: true,
	},
	emojiId: {
		type: String,
		required: true,
	},
	emojiName: {
		type: String,
		required: true,
	},
	minerals: [mineMineralSchema],
});

const toolSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	effectiveness: {
		type: Number,
		required: true,
	},
	emojiId: {
		type: String,
		required: true,
	},
	emojiName: {
		type: String,
		required: true,
	},
});

// 獎品
const prizeSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	command: {
		type: String,
	},
	value: {
		type: Number,
	},
	emojiId: {
		type: String,
	},
	emojiName: {
		type: String,
	},
});

// 抽獎池獎品資訊
const rafflePoolPrizeSchema = new mongoose.Schema({
	prize: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Prize',
	},
	rarity: {
		type: Number,
		required: true,
	},
});

// 抽獎池
const rafflePoolSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	raffleTicket: {
		type: Number,
		required: true,
	},
	emojiId: {
		type: String,
	},
	emojiName: {
		type: String,
	},
	levelRequirement: {
		type: Number,
		required: true,
		default: 1,
	},
	prizes: [rafflePoolPrizeSchema],
});

// minecraft序號
const coedSchema = new mongoose.Schema({
	code: {
		type: String,
		required: true,
		unique: true,
	},
	used: {
		type: Boolean,
		default: false,
	},
	command: {
		type: String,
		required: true,
	},
	item: {
		type: String,
		required: true,
	}
});

const Mine = db.model('Mine', mineSchema);
const Mineral = db.model('Mineral', mineralSchema);
const Tool = db.model('Tool', toolSchema);
const Prize = db.model('Prize', prizeSchema);
const RafflePool = db.model('RafflePool', rafflePoolSchema);
const Code = reisuiDb.model('Code', coedSchema);

module.exports = { Mine, Mineral, Tool, Prize, RafflePool, Code };
