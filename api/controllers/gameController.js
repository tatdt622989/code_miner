// models
const { Mineral, Tool, Mine, Prize, RafflePool } = require('../models/Game');
const { User } = require('../models/User');

// utils
const { getUserLevelAndExperience } = require('../utils/levelExperienceHandler');
const  { getRandomInt, getRandomItem } = require('../utils/randomUtil');

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

    // 檢查等級需求
    const userLevel = await getUserLevelAndExperience(discordId);
    if (userLevel.level < mine.levelRequirement) {
      return res.status(400).json({ error: `等級需求：${mine.levelRequirement}，你的等級：${userLevel.level}` });
    }

    // 挖礦
    const minerals = [];
    const typeNum = getRandomInt(1, mine.minerals.length); // 礦物種類數量
    let tempMinerals = JSON.parse(JSON.stringify(mine.minerals)); // 深拷貝礦物陣列
    let exp = 0;
    for (let i = 0; i < typeNum; i++) {
      const mineral = getRandomItem(tempMinerals); // 隨機取得礦物
      const maxDropAmount = tool.effectiveness * mineral.baseMaxDropAmount; // 工具效率 * 礦物最大掉落數量
      const num = getRandomInt(1, maxDropAmount); // 掉落數量
      exp += mineral.mineral.exp * num; // 獲得經驗

      // 如果礦物已存在，增加數量
      const existingMineral = minerals.find(m => m.name === mineral.mineral.name);
      if (existingMineral) {
        existingMineral.num += num;
        existingMineral.totalValue += mineral.mineral.value * num;
        continue;
      }
      minerals.push({
        name: mineral.mineral.name,
        perValue: mineral.mineral.value,
        totalValue: mineral.mineral.value * num,
        num,
        totalExp: mineral.mineral.exp * num,
        emojiId: mineral.mineral.emojiId,
        emojiName: mineral.mineral.emojiName,
      });
    }

    const userObj = user;

    // 紀錄獲得前的經驗、等級
    userObj.prevExp = user.experience;
    userObj.prevLevel = userLevel.level;

    // 獲得經驗
    user.experience += exp;

    // 獲得貨幣
    const totalValue = minerals.reduce((acc, cur) => acc + cur.totalValue, 0);
    user.currency += totalValue;

    await user.save();

    userObj.level = (await getUserLevelAndExperience(discordId)).level;

    res.status(200).json({ minerals, totalValue, user: userObj, totalExp: exp });
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
    const user = await User.findOne({ discordId });
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

    user.currency -= mine.price;
    user.mines.push(mine.id);
    await user.save();

    const message = `成功購買 ${mine.name}！` +
    `已自動裝備 ${mine.name} <:${mine.emojiName}:${mine.emojiId}>`;

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
    const user = await User.findOne({ discordId });
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

    user.currency -= tool.price;
    user.tools.push(tool.id);
    user.equipped.tool = tool.id;
    await user.save();

    const message = `成功購買 ${tool.name}！` +
    `已自動裝備 ${tool.name} <:${tool.emojiName}:${tool.emojiId}>`;

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
