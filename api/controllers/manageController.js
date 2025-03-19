/// models
const { Mineral, Tool, Mine, Prize, RafflePool, Pet, Weapon, WorldBoss } = require('../models/Game');

// 判斷是否為數字
function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

exports.addMineral = async(req, res) => {
  const { name, value, emojiId, emojiName, exp } = req.body;

  if (!name || !emojiId || !emojiName || !isNumeric(value)) {
    return res.status(400).json({ error: '需要礦物名稱、表情符號ID和名稱、價值' });
  }

  try {
    const newMineral = await Mineral.create({ name, value, emojiId, emojiName, exp });
    res.status(201).json(newMineral);
  } catch (error) {
    res.status(500).json({ error: '無法新增礦物' });
  }
}

exports.updateMineral = async (req, res) => {
  const { id } = req.params;
  const { name, value, emojiId, emojiName, exp } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (value) updateObj.value = value;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;
  if (exp) updateObj.exp = exp;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const mineral = await Mineral.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(mineral);
  } catch (error) {
    res.status(500).json({ error: '無法更新礦物' });
  }
}

exports.addMine = async (req, res) => {
  const { name, levelRequirement, price, emojiId, emojiName, minerals } = req.body;

  if (!name || !isNumeric(levelRequirement) || !isNumeric(price) || !emojiId || !emojiName || !minerals) {
    return res.status(400).json({ error: '需要礦場名稱、等級需求、價格、表情符號ID和名稱、礦物' });
  }

  try {
    // 檢查礦物是否存在、稀有度是否為數字、基礎最大掉落數量是否為數字
    minerals.map(mineral => {
      if (!mineral.mineral || !mineral.rarity || !isNumeric(mineral.rarity) || !mineral.baseMaxDropAmount || !isNumeric(mineral.baseMaxDropAmount)) {
        return res.status(400).json({ error: '礦物需要存在且稀有度為數字' });
      }
    });

    const newMine = await Mine.create(req.body);
    res.status(201).json(newMine);
  } catch (error) {
    res.status(500).json({ error: '無法新增礦場' });
  }
}

exports.updateMine = async (req, res) => {
  const { id } = req.params;
  const { name, levelRequirement, price, emojiId, emojiName, minerals } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (levelRequirement) updateObj.levelRequirement = levelRequirement;
  if (price) updateObj.price = price;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;
  if (minerals) updateObj.minerals = minerals;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const mine = await Mine.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(mine);
  } catch (error) {
    res.status(500).json({ error: '無法更新礦場' });
  }
}

exports.addTool = async (req, res) => {
  const { name, price, effectiveness, emojiId, emojiName } = req.body;

  if (!name || !isNumeric(price) || !isNumeric(effectiveness) || !emojiId || !emojiName) {
    return res.status(400).json({ error: '需要工具名稱、價格、效率、表情符號ID和名稱' });
  }

  try {
    const newTool = await Tool.create({ name, price, effectiveness, emojiId, emojiName });
    res.status(201).json(newTool);
  } catch (error) {
    res.status(500).json({ error: '無法新增工具' });
  }
}

exports.updateTool = async (req, res) => {
  const { id } = req.params;
  const { name, price, effectiveness, emojiId, emojiName } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (price) updateObj.price = price;
  if (effectiveness) updateObj.effectiveness = effectiveness;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const tool = await Tool.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(tool);
  } catch (error) {
    res.status(500).json({ error: '無法更新工具' });
  }
}

exports.addPet = async (req, res) => {
  const { name, price, emojiId, emojiName, triggerProbability, rewardProbability, coinReward, level } = req.body;

  if (!name || !isNumeric(price) || !emojiId || !emojiName || !isNumeric(triggerProbability) || !rewardProbability || !coinReward || !isNumeric(level)) {
    return res.status(400).json({ error: '需要寵物名稱、價格、表情符號ID和名稱、觸發機率、獎勵機率、金幣獎勵、代碼獎勵、階級' });
  }

  if (rewardProbability.coin < 0 || rewardProbability.coin > 1 || rewardProbability.code < 0 || rewardProbability.code > 1) {
    return res.status(400).json({ error: '獎勵機率需要介於0到1之間' });
  }

  if (coinReward.min < 0 || coinReward.max < 0) {
    return res.status(400).json({ error: '金幣獎勵需要大於0' });
  }

  if (coinReward.min > coinReward.max) {
    return res.status(400).json({ error: '金幣獎勵最小值需要小於最大值' });
  }

  if (level < 1) {
    return res.status(400).json({ error: '階級需要大於等於1' });
  }

  try {
    const newPet = await Pet.create(req.body);
    res.status(201).json(newPet);
  } catch (error) {
    res.status(500).json({ error: '無法新增寵物' });
  }
}

exports.updatePet = async (req, res) => {
  const { id } = req.params;
  const { name, price, emojiId, emojiName, triggerProbability, rewardProbability, coinReward, level } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (price) updateObj.price = price;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;
  if (triggerProbability) updateObj.triggerProbability = triggerProbability;
  if (rewardProbability) updateObj.rewardProbability = rewardProbability;
  if (coinReward) updateObj.coinReward = coinReward;
  if (level) updateObj.level = level;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const pet = await Pet.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({ error: '無法更新寵物' });
  }
}

exports.addPrize = async (req, res) => {
  const { name, emojiId, emojiName, command, value, petLevelRequirement, type, weight } = req.body;

  if (!name) {
    return res.status(400).json({ error: '需要獎品名稱' });
  }

  if (!command && !value || command && value) {
    return res.status(400).json({ error: '需要代碼或指令和值' });
  }

  if (type && type !== 'coin' && type !== 'code' && type !== 'pearl' && type !== 'qualityUpgradeSet') {
    return res.status(400).json({ error: '獎品類型只能是coin、code、pearl或qualityUpgradeSet' });
  }

  if (weight && !isNumeric(weight) || weight < 0) {
    return res.status(400).json({ error: '權重需要是數字且大於等於0' });
  }

  try {
    const newPrize = await Prize.create({ name, command, value, emojiId, emojiName, petLevelRequirement: petLevelRequirement || 1, type, weight });
    res.status(201).json(newPrize);
  } catch (error) {
    res.status(500).json({ error: '無法新增獎品' });
  }
}

exports.updatePrize = async (req, res) => {
  const { id } = req.params;
  const { name, emojiId, emojiName, command, value, petLevelRequirement, type, weight } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;
  if (command) updateObj.command = command;
  if (value) updateObj.value = value;
  if (petLevelRequirement) updateObj.petLevelRequirement = petLevelRequirement;
  if (type) updateObj.type = type;
  if (weight) updateObj.weight = weight;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const prize = await Prize.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(prize);
  } catch (error) {
    res.status(500).json({ error: '無法更新獎品' });
  }
}

exports.addRafflePool = async (req, res) => {
  const { name, prizes, emojiId, emojiName, levelRequirement, raffleTicket } = req.body;

  if (!name || !prizes) {
    return res.status(400).json({ error: '需要抽獎池名稱和獎品' });
  }

  try {
    const newRafflePool = await RafflePool.create({ name, prizes, emojiId, emojiName, levelRequirement, raffleTicket });
    res.status(201).json(newRafflePool);
  } catch (error) {
    res.status(500).json({ error: '無法新增抽獎池' });
  }
}

exports.addRafflePoolPrize = async (req, res) => {
  const { poolId, prizeId, rarity } = req.body;
  if (!poolId || !prizeId) {
    return res.status(400).json({ error: '需要抽獎池ID和獎品ID' });
  }
  try {
    const rafflePool = await RafflePool.findById(poolId);
    rafflePool.prizes.push({
      prize: prizeId,
      rarity,
    });
    await rafflePool.save();
    res.status(201).json(rafflePool);
  } catch (error) {
    res.status(500).json({ error: '無法新增抽獎池的獎品' });
  }
}

exports.addWeapon = async (req, res) => {
  const { name, emojiId, emojiName, basicAttack, price, basicDefense } = req.body;

  if (!name || !emojiId || !emojiName || !basicAttack || !isNumeric(price) || !basicDefense) {
    return res.status(400).json({ error: '需要武器名稱、表情符號ID和名稱、基礎攻擊、價格、基礎防禦' });
  }

  try {
    const newWeapon = await Weapon.create(req.body);
    res.status(201).json(newWeapon);
  } catch (error) {
    res.status(500).json({ error: '無法新增武器' });
  }
}

exports.updateWeapon = async (req, res) => {
  const { id } = req.params;
  const { name, emojiId, emojiName, basicAttack, price, level, quality } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;
  if (basicAttack) {
    if (basicAttack.min) {
      updateObj.basicAttack.min = basicAttack.min;
    }
    if (basicAttack.max) {
      updateObj.basicAttack.max = basicAttack.max;
    }
  }
  if (price) updateObj.price = price;
  if (level) updateObj.level = level;
  if (quality) updateObj.quality = quality;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const weapon = await Weapon.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(weapon);
  } catch (error) {
    res.status(500).json({ error: '無法更新武器' });
  }
}

exports.addWorldBoss = async (req, res) => {
  const { name, emojiId, emojiName, hp, basicAttack, difficulty } = req.body;

  if (!name || !emojiId || !emojiName || !hp || !basicAttack || !difficulty) {
    return res.status(400).json({ error: '需要世界首領名稱、表情符號ID和名稱、HP、基礎攻擊、難度' });
  }

  try {
    const newWorldBoss = await WorldBoss.create(req.body);
    res.status(201).json(newWorldBoss);
  } catch (error) {
    res.status(500).json({ error: '無法新增世界首領' });
  }
}

exports.updateWorldBoss = async (req, res) => {
  const { id } = req.params;
  const { name, emojiId, emojiName, baseHp, basicAttack, difficulty } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;
  if (baseHp) updateObj.baseHp = baseHp;
  if (basicAttack) {
    if (basicAttack.min) {
      updateObj.basicAttack.min = basicAttack.min;
    }
    if (basicAttack.max) {
      updateObj.basicAttack.max = basicAttack.max;
    }
  }
  if (difficulty) updateObj.difficulty = difficulty;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const worldBoss = await WorldBoss.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(worldBoss);
  } catch (error) {
    res.status(500).json({ error: '無法更新世界首領' });
  }
}