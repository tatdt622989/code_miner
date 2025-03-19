const mongoose = require('mongoose');
const { db, reisuiDb } = require('../dbConnections');

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
  weapon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Weapon',
  },
  quality: {
    type: Number,
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
  attack: {
    type: rangeSchema,
    required: true,
  },
  defense: {
    type: rangeSchema,
    required: true,
  },
});

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
  weapon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Weapon',
  }
});

// 藥水效果
const potionEffectDetailsSchema = new mongoose.Schema({
  durationMinutes: {
    type: Number,
    default: 0,
  },
  end: {
    type: Date,
    default: new Date(0),
  },
});
const autoMineSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: false,
  },
  durationMinutes: {
    type: Number,
    default: 0,
  },
  end: {
    type: Date,
    default: new Date(0),
  },
});
const potionEffectSchema = new mongoose.Schema({
  petTriggerProbabilityDouble: potionEffectDetailsSchema,
  miningRewardDouble: potionEffectDetailsSchema,
  autoMine: autoMineSchema,
  worldBossAttackDouble: potionEffectDetailsSchema,
  defenseDouble: potionEffectDetailsSchema
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
  magicalHerb: {
    type: Number,
    default: 0,
  },
  raffleTicket: {
    type: Number,
    default: 0,
  },
  pearl: {
    type: Number,
    default: 0,
  },
  qualityUpgradeSet: {
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
  weapons: [weaponSchema],
  equipped: {
    type: equippedSchema,
  },
  lastMine: {
    type: Date,
    default: new Date(0),
  },
  potionEffect: {
    type: potionEffectSchema,
  },
  hp: {
    type: Number,
    default: 100,
  },
  lastAttackWorldBoss: {
    type: Date,
    default: new Date(0),
  },
  infoPictureHash: {
    type: String,
    default: '',
  }
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

