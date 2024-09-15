const express = require('express');
const router = express.Router();

/// models
const { Mineral, Tool, Mine, Prize, RafflePool, Pet } = require('../models/Game');

// 判斷是否為數字
function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// 新增礦物
router.post('/mineral', async (req, res) => {
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
});

// 更新礦物
router.put('/mineral/:id', async (req, res) => {
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
});

// 新增礦場
router.post('/mine', async (req, res) => {
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
});

// 更新礦場
router.put('/mine/:id', async (req, res) => {
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
});

// 新增工具
router.post('/tool', async (req, res) => {
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
});

// 更新工具
router.put('/tool/:id', async (req, res) => {
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
});

// 新增寵物
router.post('/pet', async (req, res) => {
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
});

// 更新寵物
router.put('/pet/:id', async (req, res) => {
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
});

// 新增獎品
router.post('/price', async (req, res) => {
  const { name, emojiId, emojiName, command, value, petLevelRequirement } = req.body;

  if (!name) {
    return res.status(400).json({ error: '需要獎品名稱' });
  }

  if (!command && !value || command && value) {
    return res.status(400).json({ error: '需要代碼或指令和值' });
  }

  try {
    const newPrize = await Prize.create({ name, command, value, emojiId, emojiName, petLevelRequirement: petLevelRequirement || 1 });
    res.status(201).json(newPrize);
  } catch (error) {
    res.status(500).json({ error: '無法新增獎品' });
  }
});

// 更新獎品
router.put('/price/:id', async (req, res) => {
  console.log(req.body);
  const { id } = req.params;
  const { name, emojiId, emojiName, command, value, petLevelRequirement } = req.body;

  // 只更新有提供的欄位
  const updateObj = {};
  if (name) updateObj.name = name;
  if (emojiId) updateObj.emojiId = emojiId;
  if (emojiName) updateObj.emojiName = emojiName;
  if (command) updateObj.command = command;
  if (value) updateObj.value = value;
  if (petLevelRequirement) updateObj.petLevelRequirement = petLevelRequirement;

  if (Object.keys(updateObj).length === 0) {
    return res.status(400).json({ error: '需要更新的欄位' });
  }

  try {
    const prize = await Prize.findByIdAndUpdate(id, updateObj, { new: true });
    res.status(200).json(prize);
  } catch (error) {
    res.status(500).json({ error: '無法更新獎品' });
  }
});

// 新增抽獎池
router.post('/rafflePool', async (req, res) => {
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
});

// 新增抽獎池的獎品
router.post('/rafflePool/prize', async (req, res) => {
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
});

module.exports = router;