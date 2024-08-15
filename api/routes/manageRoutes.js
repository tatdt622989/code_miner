const express = require('express');
const router = express.Router();

/// models
const { Mineral, Tool, Mine, Prize, RafflePool } = require('../models/Game');

// 新增礦物
router.post('/mineral', async (req, res) => {
  const { name, value, emojiId, emojiName, exp } = req.body;

  if (!name || Number.isNaN(emojiId) || !emojiName || Number.isNaN(value)) {
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

  if (!name || Number.isNaN(levelRequirement) || Number.isNaN(price) || Number.isNaN(emojiId) || !emojiName || !minerals) {
    return res.status(400).json({ error: '需要礦場名稱、等級需求、價格、表情符號ID和名稱、礦物' });
  }

  try {
    const obj = {
      name,
      levelRequirement,
      price,
      emojiId,
      emojiName,
      minerals,
    };
    // 檢查礦物是否存在、稀有度是否為數字、基礎最大掉落數量是否為數字
    obj.minerals.map(mineral => {
      if (!mineral.mineral || !mineral.rarity || Number.isNaN(mineral.rarity) || !mineral.baseMaxDropAmount || Number.isNaN(mineral.baseMaxDropAmount)) {
        return res.status(400).json({ error: '礦物需要存在且稀有度為數字' });
      }
    });

    const newMine = await Mine.create(obj);
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

  if (!name || Number.isNaN(price) || Number.isNaN(effectiveness) || Number.isNaN(emojiId) || !emojiName) {
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

// 新增獎品
router.post('/price', async (req, res) => {
  const { name, emojiId, emojiName, command, value } = req.body;

  if (!name) {
    return res.status(400).json({ error: '需要獎品名稱' });
  }

  if (!command && !value || command && value) {
    return res.status(400).json({ error: '需要代碼或指令和值' });
  }

  try {
    const newPrize = await Prize.create({ name, command, value, emojiId, emojiName });
    res.status(201).json(newPrize);
  } catch (error) {
    res.status(500).json({ error: '無法新增獎品' });
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

module.exports = router;