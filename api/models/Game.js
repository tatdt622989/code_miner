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
	baseMinDropAmount: {
		type: Number,
		required: true,
		default: 1,
	},
});

// 礦場
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

// 工具
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
	type: {
		type: String,
		required: true,
	},
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
	petLevelRequirement: {
		type: Number,
		default: 1,
	},
	weight: {
		type: Number,
		required: true,
		default: 10000,
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

// 寵物
const petSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
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
	triggerProbability: {
		type: Number,
		required: true,
	},
	rewardProbability: {
		coin: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
		code: {
			type: Number,
			required: true,
			min: 0,
			max: 1
		},
	},
	coinReward: {
		min: {
			type: Number,
			required: true,
		},
		max: {
			type: Number,
			required: true,
		},
	},
	level: {
		type: Number,
		required: true,
		default: 1,
	},
});

// 基礎攻擊
const rangeSchema = new mongoose.Schema({
	min: {
		type: Number,
		required: true,
	},
	max: {
		type: Number,
		required: true,
	},
});

// 武器
const weaponSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
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
	basicAttack: rangeSchema,
	basicDefense: rangeSchema,
});

// 世界BOSS
const worldBossSchema = new mongoose.Schema({
	name: {
		type: String,
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
	baseHp: {
		type: Number,
		required: true,
	},
	basicAttack: rangeSchema,
	difficulty: {
		type: Number,
		required: true,
	},
});

// 世界BOSS出現紀錄
const worldBossRecordSchema = new mongoose.Schema({
	attack: rangeSchema,
	worldBoss: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'WorldBoss',
	},
	hp: {
		type: Number,
		required: true,
	},
	remainingHp: {
		type: Number,
		required: true,
	},
	quality: {
		type: Number,
		required: true,
		default: 1,
	},
	participatingUsers: [{
		userDamage: {
			type: Number,
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		isFinalHit: {
			type: Boolean,
			default: false,
		},
		isClaimed: {
			type: Boolean,
			default: false,
		},
		receivedPrize: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Prize',
		}],
		receivedPearl: {
			type: Number,
			default: 0
		},
		receivedQualityUpgradeSet: {
			type: Number,
			default: 0
		}
	}]
}, { timestamps: true });

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
}, { timestamps: true });

const Mine = db.model('Mine', mineSchema);
const Mineral = db.model('Mineral', mineralSchema);
const Tool = db.model('Tool', toolSchema);
const Prize = db.model('Prize', prizeSchema);
const RafflePool = db.model('RafflePool', rafflePoolSchema);
const Code = reisuiDb.model('Code', coedSchema);
const Pet = db.model('Pet', petSchema);
const Weapon = db.model('Weapon', weaponSchema);
const WorldBoss = db.model('WorldBoss', worldBossSchema);
const WorldBossRecord = db.model('WorldBossRecord', worldBossRecordSchema);

module.exports = { Mine, Mineral, Tool, Prize, RafflePool, Code, Pet, Weapon, WorldBoss, WorldBossRecord };
