// models
const { Tool, Mine, Prize, RafflePool, Code, Pet, Weapon, WorldBoss, WorldBossRecord } = require('../models/Game');
const { User, UserPrize } = require('../models/User');

// utils
const { getUserLevelAndExperience } = require('../utils/levelExperienceHandler');
const { getRandomInt, getRandomItem, getRandomFloat } = require('../utils/randomUtil');
const { getStrengthenData, getQualityData, getWeaponAttack, getQualityName } = require('../utils/weaponUtil');
const { potionInfo, timeMap } = require('../utils/potionInfo'); // 藥水資訊

function codeGenerator(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(getRandomInt(0, characters.length - 1));
  }
  return result;
}

function getMineReward(mine, tool, miningRewardDouble = {}) {
  const minerals = [];
  const typeNum = getRandomInt(1, mine.minerals.length); // 隨機取得礦物種類數量
  let allMinerals = mine.minerals.map(m => m.toObject()); // 轉換為一般陣列
  let exp = 0;
  for (let i = 0; i < typeNum; i++) {
    const selectedMineral = getRandomItem(allMinerals); // 隨機取得礦物
    const maxDropAmount = tool.effectiveness * selectedMineral.baseMaxDropAmount; // 工具效率 * 礦物最大掉落數量
    const isDuringPotionEffect = miningRewardDouble.active; // 挖礦獎勵加倍藥水效果
    const num = getRandomInt(1, maxDropAmount) * (isDuringPotionEffect ? 2 : 1); // 隨機取得掉落數量，若有效果則翻倍
    exp += selectedMineral.mineral.exp * num; // 獲得經驗

    // 如果礦物已存在，增加1/4機率增加掉落數量
    const existingMineral = minerals.find(m => m.name === selectedMineral.mineral.name);
    if (existingMineral) {
      if (Math.random() < 0.25) {
        existingMineral.num += Math.floor(num / 2);
        existingMineral.totalValue += selectedMineral.mineral.value * Math.floor(num / 2);
        existingMineral.totalExp += selectedMineral.mineral.exp * Math.floor(num / 2);
        continue;
      }
      continue;
    }

    minerals.push({
      name: selectedMineral.mineral.name,
      perValue: selectedMineral.mineral.value,
      totalValue: selectedMineral.mineral.value * num,
      num,
      totalExp: selectedMineral.mineral.exp * num,
      emojiId: selectedMineral.mineral.emojiId,
      emojiName: selectedMineral.mineral.emojiName,
    });
  }

  const totalValue = minerals.reduce((acc, cur) => acc + cur.totalValue, 0);

  return { minerals, exp, totalValue };
}

// 挖礦
exports.mine = async (req, res) => {
  const { discordId } = req.params;

  if (!discordId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  try {
    const user = await User.findOne({ discordId });
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    // 檢查是否有預設資料
    let defaultMine, defaultTool;
    if (user.mines.length === 0) {
      // 預設礦場
      defaultMine = await Mine.findOne({ levelRequirement: 0 });
      user.mines.push(defaultMine.id);
      // 預設工具
      defaultTool = await Tool.findOne({ price: 0 });
      user.tools.push(defaultTool.id);
      // 裝備預設工具、礦場
      user.equipped = {
        mine: defaultMine.id,
        tool: defaultTool.id,
      }
      await user.save();
    }

    const mine = await Mine.findById(user.equipped.mine).populate({
      path: 'minerals.mineral',
      model: 'Mineral',
    });
    const tool = await Tool.findById(user.equipped.tool);

    const userLevel = getUserLevelAndExperience(user);

    // 取得魔法藥草
    let magicHerbCollected = 0;
    if (getRandomInt(0, 99) < 7) {
      magicHerbCollected = getRandomInt(1, 3);
      user.magicalHerb += magicHerbCollected;
    }

    // 取得藥水效果
    const {
      petTriggerProbabilityDouble = {},
      miningRewardDouble = {},
      autoMine = {},
    } = user.potionEffect && user.potionEffect.toObject() || {};
    petTriggerProbabilityDouble.active = petTriggerProbabilityDouble.end > new Date();
    miningRewardDouble.active = miningRewardDouble.end > new Date();

    // 挖礦事件
    const mineEvent = getMineReward(mine, tool, miningRewardDouble);
    user.experience += mineEvent.exp;
    user.currency += mineEvent.totalValue;

    // 自動挖礦事件
    let autoMineExp = 0;
    let autoMineTotalValue = 0;
    let mergedAutoMineMinerals = [];
    if (autoMine.active && autoMine.end < new Date()) {
      const autoMineMinerals = [];
      const miningInterval = 6 * 1000; // 每6秒挖礦一次
      const mineDuration = autoMine.durationMinutes * 60 * 1000;
      const miningTimes = Math.floor(mineDuration / miningInterval);
      console.log('miningTimes', miningTimes);
      for (let i = 0; i < miningTimes; i++) {
        const { minerals, exp, totalValue } = getMineReward(mine, tool);
        user.experience += exp;
        user.currency += totalValue;
        autoMineExp += exp;
        autoMineMinerals.push(...minerals);
        autoMineTotalValue += totalValue;
      }
      user.potionEffect.autoMine.active = false;
      console.log('exp', autoMineExp);
      console.log('totalValue', autoMineTotalValue);
      // 重複礦物合併
      const mineralsMap = new Map();
      autoMineMinerals.forEach(m => {
        if (mineralsMap.has(m.name)) {
          const existingMineral = mineralsMap.get(m.name);
          existingMineral.num += m.num;
          existingMineral.totalValue += m.totalValue;
          existingMineral.totalExp += m.totalExp;
        } else {
          mineralsMap.set(m.name, {
            name: m.name,
            totalValue: m.totalValue,
            num: m.num,
            totalExp: m.totalExp,
            emojiId: m.emojiId,
            emojiName: m.emojiName,
          });
        }
      });
      // 轉換為陣列
      mergedAutoMineMinerals = Array.from(mineralsMap.values());
    }

    // 寵物事件
    let petReward = null;
    let pet = null;
    if (user.equipped.pet) {
      pet = await Pet.findById(user.equipped.pet);
      if (pet) {
        const isDuringPotionEffect = petTriggerProbabilityDouble.active; // 寵物觸發機率加倍藥水效果
        const triggerProbability = pet.triggerProbability * (isDuringPotionEffect ? 2 : 1);
        const isTrigger = getRandomFloat(0, 99) <= triggerProbability;
        if (isTrigger) {
          const type = getRandomItem([{ name: 'coin', rarity: pet.rewardProbability.coin }, { name: 'code', rarity: pet.rewardProbability.code }]);
          if (type.name === 'coin') {
            const value = getRandomInt(pet.coinReward.min, pet.coinReward.max);
            petReward = { type: 'coin', value };
            user.currency += value;
          }
          if (type.name === 'code') {
            // 取得所有序號獎品
            const prizes = await Prize.find({ command: { $exists: true, $ne: "" } });

            // 取得符合寵物等級需求的序號獎品
            const levelPrizes = prizes.filter(p => p.petLevelRequirement <= pet.level);
            const prizeLength = levelPrizes.length;

            // 隨機取得一個序號獎品
            const prizeIndex = getRandomInt(0, prizeLength - 1);
            const prize = levelPrizes[prizeIndex];

            // 產生序號
            let code = codeGenerator(10);
            //檢查是否有重複的序號
            while (await Code.findOne({ code })) {
              code = codeGenerator(10);
            }

            // 新增序號
            const newCode = new Code({
              code,
              used: false,
              command: prize.command,
              item: prize.name,
            });
            await newCode.save();

            petReward = { type: 'code', code, command: prize.command, item: prize.name, emojiId: prize.emojiId, emojiName: prize.emojiName };

            // 新增到獎品紀錄
            const newUserPrize = new UserPrize({
              prize: prize.id,
              user: user.id,
              code,
              command: prize.command,
              origin: 'pet',
            });
            await newUserPrize.save();
          }
        }
      }
    }

    const userObj = user._doc;

    // 紀錄獲得前的經驗、等級
    userObj.prevExp = user.experience;
    userObj.prevLevel = userLevel.level;

    // 檢查是否升等，若升等，增加金幣
    const { level, levelUpRewards, nextLevelExperience, experience } = getUserLevelAndExperience(user);
    if (level > userObj.prevLevel) {
      user.currency += levelUpRewards
    }
    userObj.level = level;

    // 檢查是否為當日首次挖礦，獲得一把鑰匙，每天0點重置，轉換成Taipei時間
    let now = new Date();
    now.setHours(now.getHours() + 8);
    const zeroToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastMineDate = user.lastMine || new Date(0);
    if (zeroToday > lastMineDate) {
      user.raffleTicket += 1;
      user.lastMine = now;
    }

    await user.save();

    res.status(200).json({
      autoMineResult: {
        minerals: mergedAutoMineMinerals,
        totalValue: autoMineTotalValue,
        totalExp: autoMineExp,
      },
      mineResult:{
        minerals: mineEvent.minerals,
        totalValue: mineEvent.totalValue,
        totalExp: mineEvent.exp,
      },
      user: userObj,
      tool,
      mine,
      level,
      levelUpRewards,
      isLevelUp: level > userObj.prevLevel,
      experience,
      nextLevelExperience,
      isDailyFirstMine: zeroToday > lastMineDate,
      pet,
      petReward,
      potionInfo,
      potionEffect: [
        petTriggerProbabilityDouble,
        miningRewardDouble,
        autoMine,
      ],
      magicHerbCollected: magicHerbCollected || 0,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法挖礦' });
  }
}

// 礦場列表
exports.listMines = async (req, res) => {
  const { discordId } = req.params;

  if (!discordId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  try {
    const mines = await Mine.find();
    // 玩家已擁有的礦場
    const user = await User.findOne({ discordId }).populate('mines');
    const userMines = user.mines.map(m => m.id);
    const minesWithUser = mines.map(mine => {
      return {
        ...mine._doc,
        owned: userMines.includes(mine.id),
      }
    });
    res.status(200).json(minesWithUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得礦場列表' });
  }
}

// 工具列表
exports.listTools = async (req, res) => {
  const { discordId } = req.params;

  if (!discordId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  try {
    const tools = await Tool.find();
    // 玩家已擁有的工具
    const user = await User.findOne({ discordId }).populate('tools');
    const userTools = user.tools.map(tool => tool.id);
    const toolsWithUser = tools.map(tool => {
      return {
        ...tool._doc,
        owned: userTools.includes(tool.id),
      }
    });
    res.status(200).json(toolsWithUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得工具列表' });
  }
}

// 特定工具
exports.listTool = async (req, res) => {
  const { toolId } = req.params;

  if (!toolId) {
    return res.status(400).json({ error: '需要工具ID' });
  }

  try {
    const tool = await Tool.findById(toolId);
    res.status(200).json(tool);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得工具' });
  }
}

// 寵物列表
exports.listPets = async (req, res) => {
  const { discordId } = req.params;

  if (!discordId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  try {
    const pets = await Pet.find();
    // 玩家已擁有的寵物
    const user = await User.findOne({ discordId }).populate('pets');
    const userPets = user.pets.map(pet => pet.id);
    const petsWithUser = pets.map(pet => {
      return {
        ...pet._doc,
        owned: userPets.includes(pet.id),
      }
    });
    res.status(200).json(petsWithUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得寵物列表' });
  }
}

// 特定寵物
exports.listPet = async (req, res) => {
  const { petId } = req.params;

  if (!petId) {
    return res.status(400).json({ error: '需要寵物ID' });
  }

  try {
    const pet = await Pet.findById(petId);
    res.status(200).json(pet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得寵物' });
  }
}

// 抽獎池列表
exports.listRafflePools = async (req, res) => {
  try {
    const rafflePools = await RafflePool.find();
    res.status(200).json(rafflePools);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得抽獎池列表' });
  }
}

// 藥水列表
exports.listPotion = async (req, res) => {
  try {
    res.status(200).json({
      potionInfo,
      timeMap
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得藥水列表' });
  }
}

// 武器列表
exports.listWeapons = async (req, res) => {
  try {
    const weapons = await Weapon.find({});
    res.status(200).json(weapons);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得武器列表' });
  }
}

// 世界首領列表
exports.listWorldBosses = async (req, res) => {
  try {
    const bosses = await WorldBoss.find({});
    res.status(200).json(bosses);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得首領列表' });
  }
}

// 出現中的世界首領
exports.getCurrentWorldBoss = async (req, res) => {
  try {
    const currentBoss = await WorldBossRecord.findOne({}).sort({ createdAt: -1 }).populate('boss');
    res.status(200).json(currentBoss);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得首領' });
  }
}

// 取得特定抽獎池
exports.getRafflePool = async (req, res) => {
  const { poolId } = req.params;

  if (!poolId) {
    return res.status(400).json({ error: '需要抽獎池ID' });
  }

  try {
    const rafflePool = await RafflePool.findById(poolId).populate({
      path: 'prizes.prize',
      model: 'Prize',
    })
    res.status(200).json(rafflePool);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法取得抽獎池' });
  }
}

// 購買礦場
exports.buyMine = async (req, res) => {
  const { discordId, mineId } = req.body;

  if (!discordId || !mineId) {
    return res.status(400).json({ error: '需要用戶ID和礦場ID' });
  }

  try {
    const user = await User.findOne({ discordId }).populate({
      path: 'equipped.mine',
      model: 'Mine',
    })
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const mine = await Mine.findById(mineId);
    if (!mine) {
      return res.status(404).json({ error: '找不到礦場' });
    }

    if (user.currency < mine.price) {
      return res.status(400).json({ error: '貨幣不足' });
    }

    if (user.mines.includes(mine.id)) {
      return res.status(400).json({ error: '已擁有此礦場' });
    }

    let message = `成功購買 ${mine.name}！`;

    user.currency -= mine.price;
    user.mines.push(mine.id);
    // 如購買的礦場價格低於已裝備的礦場，則不自動裝備
    if (user.equipped?.mine?.price <= mine.price || !user.equipped.mine) {
      user.equipped.mine = mine.id;
      message += `\n已自動裝備 ${mine.name} <:${mine.emojiName}:${mine.emojiId}>`;
    }

    await user.save();

    res.status(200).json({ message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法購買礦場' });
  }
}

// 購買工具
exports.buyTool = async (req, res) => {
  const { discordId, toolId } = req.body;

  if (!discordId || !toolId) {
    return res.status(400).json({ error: '需要用戶ID和工具ID' });
  }

  try {
    const user = await User.findOne({ discordId }).populate({
      path: 'equipped.tool',
      model: 'Tool',
    });
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const tool = await Tool.findById(toolId);
    if (!tool) {
      return res.status(404).json({ error: '找不到工具' });
    }

    if (user.currency < tool.price) {
      return res.status(400).json({ error: '貨幣不足' });
    }

    if (user.tools.includes(tool.id)) {
      return res.status(400).json({ error: '已擁有此工具' });
    }

    let message = `成功購買 ${tool.name}！`;

    user.currency -= tool.price;
    user.tools.push(tool.id);
    // 如購買的工具價格低於已裝備的工具，則不自動裝備
    if (user.equipped?.tool?.price <= tool.price || !user.equipped.tool) {
      user.equipped.tool = tool.id;
      message += `\n已自動裝備 ${tool.name} <:${tool.emojiName}:${tool.emojiId}>`;
    }
    await user.save();

    res.status(200).json({ message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法購買工具' });
  }
}

// 購買鑰匙
exports.buyKey = async (req, res) => {
  const { discordId, num } = req.body;

  if (!discordId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  const keyPrice = 5000;
  try {
    const user = await User.findOne({ discordId });
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    if (user.currency < keyPrice * num) {
      return res.status(400).json({ error: '貨幣不足' });
    }

    user.currency -= keyPrice * Number(num);

    // 增加鑰匙
    user.raffleTicket += Number(num);

    await user.save();

    res.status(200).json({ message: '成功購買 ' + num + ' 把鑰匙！', user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法購買鑰匙' });
  }
}

// 購買寵物
exports.buyPet = async (req, res) => {
  const { discordId, petId } = req.body;

  if (!discordId || !petId) {
    return res.status(400).json({ error: '需要用戶ID和寵物ID' });
  }

  try {
    const user = await User.findOne({ discordId }).populate({
      path: 'equipped.pet',
      model: 'Pet',
    });
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: '找不到寵物' });
    }

    if (user.currency < pet.price) {
      return res.status(400).json({ error: '貨幣不足' });
    }

    if (user.pets.includes(pet.id)) {
      return res.status(400).json({ error: '已擁有此寵物' });
    }

    let message = `成功購買 ${pet.name}！`;

    user.currency -= pet.price;
    user.pets.push(pet.id);
    // 如購買的寵物價格低於已裝備的寵物，則不自動裝備
    if (user.equipped?.pet?.price <= pet.price || !user.equipped.pet) {
      user.equipped.pet = pet.id;
      message += `\n<:${pet.emojiName}:${pet.emojiId}> **${pet.name}** 已開始跟隨你！`;
    }

    await user.save();

    res.status(200).json({ message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法購買寵物' });
  }
}

// 購買藥水
exports.buyPotion = async (req, res) => {
  const { discordId, type, timeId } = req.body;

  if (!discordId || !type || !timeId || !timeMap[timeId] || !potionInfo[type].price) {
    return res.status(400).json({ error: '需要用戶ID和藥水類型和時間ID' });
  }

  try {
    const user = await User.findOne({ discordId })
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    // 取得藥水效果
    const {
      petTriggerProbabilityDouble = {},
      miningRewardDouble = {},
      autoMine = {},
    } = user.potionEffect && user.potionEffect.toObject() || {};
    petTriggerProbabilityDouble.active = petTriggerProbabilityDouble.end > new Date();
    miningRewardDouble.active = miningRewardDouble.end > new Date();
    const potionInfoCopy = JSON.parse(JSON.stringify(potionInfo));
    potionInfoCopy[1].active = petTriggerProbabilityDouble.active;
    potionInfoCopy[2].active = miningRewardDouble.active;
    potionInfoCopy[3].active = autoMine.active;

    // 檢查是否在使用狀態
    console.log('potionInfoCopy', potionInfoCopy);
    if (potionInfoCopy[type].active) {
      return res.status(400).json({ error: '藥水效果仍在使用中' });
    }

    const potionPrice = potionInfoCopy[type].price * timeId;
    if (user.magicalHerb < potionPrice) {
      return res.status(400).json({ error: '魔法草藥不足' });
    }

    user.magicalHerb -= potionPrice;

    // 檢查是否有藥水效果資料
    if (!user.potionEffect) {
      user.potionEffect = {
        petTriggerProbabilityDouble: {
          durationMinutes: 0,
          end: new Date(0),
        },
        miningRewardDouble: {
          durationMinutes: 0,
          end: new Date(0),
        },
        autoMine: {
          active: false,
          durationMinutes: 0,
          end: new Date(0),
        },
      }
    }

    // 藥草效果
    const now = new Date();
    switch (type) {
      case '1':
        user.potionEffect.petTriggerProbabilityDouble.durationMinutes = timeMap[timeId];
        user.potionEffect.petTriggerProbabilityDouble.end = new Date(now.getTime() + timeMap[timeId] * 60 * 1000);
        break;
      case '2':
        user.potionEffect.miningRewardDouble.durationMinutes = timeMap[timeId];
        user.potionEffect.miningRewardDouble.end = new Date(now.getTime() + timeMap[timeId] * 60 * 1000);
        break;
      case '3':
        user.potionEffect.autoMine.active = true;
        user.potionEffect.autoMine.durationMinutes = timeMap[timeId];
        user.potionEffect.autoMine.end = new Date(now.getTime() + timeMap[timeId] * 60 * 1000);
        break;
    }

    await user.save();
    res.status(200).json({ message: `成功購買 <:${potionInfoCopy[type].emojiName}:${potionInfoCopy[type].emojiId}> ${potionInfoCopy[type].name}！`, user });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法購買藥水' });
  }
}

// 購買武器
exports.buyWeapon = async (req, res) => {
  const { discordId, weaponId } = req.body;

  if (!discordId || !weaponId) {
    return res.status(400).json({ error: '需要用戶ID和武器ID' });
  }

  try {
    const user = await User.findOne({ discordId }).populate('weapons')
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const weapons = await Weapon.find({}).sort({ price: -1 });
    const weapon = weapons.find(w => w.id === weaponId);

    if (!weapon) {
      return res.status(404).json({ error: '找不到武器' });
    }

    if (user.currency < weapon.price) {
      return res.status(400).json({ error: '貨幣不足' });
    }

    const isWeaponOwned = user.weapons.some(w => {
      const id = w.weapon.toString();
      return id === weapon.id;
    });
    if (isWeaponOwned) {
      return res.status(400).json({ error: '已擁有此武器' });
    }

    const cheaperWeapon = weapons.find(w => w.price < weapon.price);
    if (cheaperWeapon) {
      const userCheaperWeapon = user.weapons.find(w => w.id === cheaperWeapon.id);
      if (userCheaperWeapon && userCheaperWeapon.level < 15) {
        return res.status(400).json({ error: `強化等級不足，請先強化 ${cheaperWeapon.name} 到 +15` });
      }
    }

    user.currency -= weapon.price;
    user.weapons.push({
      weapon: weapon.id,
      level: 0,
      quality: 1,
      attack: {
        min: weapon.basicAttack.min,
        max: weapon.basicAttack.max
      }
    });

    await user.save();

    res.status(200).json({ message: `成功購買 ${weapon.name}！` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法購買武器' });
  }
}

// 裝備武器
exports.equipWeapon = async (req, res) => {
  const { discordId, weaponId } = req.body;

  if (!discordId || !weaponId) {
    return res.status(400).json({ error: '需要用戶ID和武器ID' });
  }

  try {
    const user = await User.findOne({ discordId }).populate('weapons')
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const weapon = await Weapon.findById(weaponId);
    if (!weapon) {
      return res.status(404).json({ error: '找不到武器' });
    }

    const isWeaponOwned = user.weapons.some(w => {
      const id = w.weapon.toString();
      return id === weapon.id;
    });
    if (!isWeaponOwned) {
      return res.status(400).json({ error: '未擁有此武器' });
    }

    user.equipped.weapon = weapon._id;
    await user.save();

    res.status(200).json({ message: `成功裝備 ${weapon.name}！` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法裝備武器' });
  }
}

// 強化武器
exports.strengthenWeapon = async (req, res) => {
  const { discordId, userWeaponId } = req.body;

  if (!discordId || !userWeaponId) {
    return res.status(400).json({ error: '需要用戶ID和武器ID' });
  }

  try {
    const user = await User.findOne({ discordId }).populate({
      path: 'weapons',
      populate: {
        path: 'weapon',
        model: 'Weapon',
      }
    })
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    console.log('user', user.name, user.discordId);

    const userWeapon = user.weapons.find(w => w.id === userWeaponId);
    if (!userWeapon) {
      return res.status(404).json({ error: '找不到武器' });
    }

    const nextLevel = userWeapon.level + 1;
    const strengthenData = getStrengthenData(nextLevel);
    if (!strengthenData) {
      return res.status(400).json({ error: '已到達最高強化等級' });
    }

    if (!user.pearl || user.pearl < strengthenData.pearl) {
      return res.status(400).json({ error: '強化寶珠不足' });
    }

    user.pearl -= strengthenData.pearl;

    const isSuccess = getRandomInt(0, 999) < strengthenData.probability * 1000;
    if (isSuccess) {
      userWeapon.level = nextLevel;
      ['min', 'max'].forEach(attr => {
        userWeapon.attack[attr] = (userWeapon.attack[attr] * strengthenData.increase).toFixed(2);
      });
      await user.save();
      console.log('強化成功', userWeapon.weapon.name, userWeapon.level);
      res.status(200).json({ message: `成功強化 ${userWeapon.weapon.name} 到 **+${userWeapon.level}** 等級！ \n 新的攻擊力:${userWeapon.attack.min} ~ ${userWeapon.attack.max}` });
    } else {
      console.log('強化失敗', userWeapon.weapon.name, userWeapon.level);
      res.status(200).json({ message: `強化失敗！` });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法強化武器' });
  }
}

// 提升武器品質
exports.upgradeWeaponQuality = async (req, res) => {
  const { discordId, userWeaponId } = req.body;

  if (!discordId || !userWeaponId) {
    return res.status(400).json({ error: '需要用戶ID和武器ID' });
  }

  try {
    const user = await User.findOne({ discordId }).populate({
      path: 'weapons',
      populate: {
        path: 'weapon',
        model: 'Weapon',
      }
    })
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const userWeapon = user.weapons.find(w => w.id === userWeaponId);
    if (!userWeapon) {
      return res.status(404).json({ error: '找不到武器' });
    }

    const nextQuality = userWeapon.quality + 1;
    const qualityData = getQualityData(nextQuality);
    if (!qualityData) {
      return res.status(400).json({ error: '已到達最高品質' });
    }

    if (!user.qualityUpgradeSet || user.qualityUpgradeSet < qualityData.qualityUpgradeSet) {
      return res.status(400).json({ error: '提升品質所需升級套裝不足' });
    }

    user.qualityUpgradeSet -= qualityData.qualityUpgradeSet;

    const isSuccess = getRandomInt(0, 999) < qualityData.probability * 1000;
    if (isSuccess) {
      userWeapon.quality = nextQuality;
      const attack = await getWeaponAttack(userWeapon.weapon.id, userWeapon.quality, userWeapon.level)
      userWeapon.attack = attack;
      await user.save();
      console.log('提升品質成功', userWeapon.weapon.name, userWeapon.quality);
      res.status(200).json({ message: `成功提升 ${userWeapon.weapon.name} 到 **${getQualityName(userWeapon.quality)}** 品質！ \n 新的攻擊力:${userWeapon.attack.min} ~ ${userWeapon.attack.max}` });
    } else {
      console.log('提升品質失敗', userWeapon.weapon.name, userWeapon.quality);
      res.status(200).json({ message: `提升品質失敗！` });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法提升武器品質' });
  }
}

// 抽寶箱
exports.openChest = async (req, res) => {
  const { discordId, chestId } = req.body;

  if (!discordId || !chestId) {
    return res.status(400).json({ error: '需要用戶ID和寶箱ID' });
  }

  try {
    const user = await User.findOne({ discordId });
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const chest = await RafflePool.findById(chestId).populate({
      path: 'prizes.prize',
      model: 'Prize',
    });

    if (!chest) {
      return res.status(404).json({ error: '找不到寶箱' });
    }

    // 檢查鑰匙數量
    if (user.raffleTicket < chest.raffleTicket) {
      return res.status(400).json({ error: '鑰匙不足' });
    }

    // 扣除鑰匙
    user.raffleTicket -= chest.raffleTicket;

    // 抽獎
    const prize = getRandomItem(chest.prizes);

    // 新增到抽獎紀錄
    const newUserPrize = new UserPrize({
      prize: prize.prize.id,
      user: user.id,
    });

    // 如果是金幣，增加金幣
    if (prize.prize.value && prize.prize.type === 'coin') {
      user.currency += prize.prize.value;
      newUserPrize.value = prize.prize.value;
    }

    // 如果是序號，增加序號
    let code;
    if (prize.prize.command) {
      code = codeGenerator(10);
      //檢查是否有重複的序號
      while (await Code.findOne({ code })) {
        code = codeGenerator(10);
      }
      const newCode = new Code({
        code,
        used: false,
        command: prize.prize.command,
        item: prize.prize.name,
      });

      await newCode.save();

      newUserPrize.code = code;
      newUserPrize.command = prize.prize.command;
    }
    await newUserPrize.save();

    await user.save();

    res.status(200).json({ prize, user, code });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法開啟寶箱' });
  }
}

// 賭博
exports.bet = async (req, res) => {
  const { discordId, magnification, amount } = req.body;
  const allowedMagnifications = [2, 3, 5];
  const probability = [0.5, 0.25, 0.12];

  if (!discordId || !magnification || !amount) {
    return res.status(400).json({ error: '需要用戶ID、倍率和金幣數量' });
  }


  if (!allowedMagnifications.includes(magnification)) {
    return res.status(400).json({ error: '不允許的倍率' });
  }

  try {
    const user = await User.findOne({ discordId });
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    if (user.currency < amount) {
      return res.status(400).json({ error: '金幣不足' });
    }

    user.currency -= amount;

    // 檢查是否中獎
    const isWin = getRandomFloat(0, 0.99) <= probability[allowedMagnifications.indexOf(magnification)];
    if (isWin) {
      user.currency += amount * magnification;
    }

    await user.save();

    res.status(200).json({ isWin, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法賭博' });
  }
}