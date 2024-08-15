// models
const { Mineral, Tool, Mine, Prize, RafflePool } = require('../models/Game');
const { User } = require('../models/User');

// utils
const { getUserLevelAndExperience } = require('../utils/levelExperienceHandler');
const  { getRandomInt, getRandomItem } = require('../utils/randomUtil');

// 挖礦
exports.mine = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  try {
    const user = await User.findById(userId);
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
    }

    const mine = defaultMine || await Mine.findById(user.equipped.mine).populate({
      path: 'minerals.mineral',
      model: 'Mineral',
    });
    const tool = defaultTool || await Tool.findById(user.equipped.tool);

    // 檢查等級需求
    const userLevel = await getUserLevelAndExperience(userId);
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

    // 獲得經驗
    user.experience += exp;

    // 獲得貨幣
    const totalValue = minerals.reduce((acc, cur) => acc + cur.totalValue, 0);
    user.currency += totalValue;

    await user.save();

    res.status(200).json({ minerals, totalValue, user, totalExp: exp });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法挖礦' });
  }
}

// 礦場列表
exports.listMines = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  try {
    const mines = await Mine.find();
    // 玩家已擁有的礦場
    const user = await User.findById(userId).populate('mines');
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
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: '需要用戶ID' });
  }

  try {
    const tools = await Tool.find();
    // 玩家已擁有的工具
    const user = await User.findById(userId).populate('tools');
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