const { User } = require('../models/User');

const { getUserLevelAndExperience } = require('../utils/levelExperienceHandler');
const { getQualityName } = require('../utils/weaponUtil');

const levelColorMap = {
  0: 0xB0B0B0,      // 普通等級 (灰色)
  25: 0x6A9BD9,     // 稍微高一點 (淺藍色)
  50: 0xFFD700,     // 中等等級 (金色)
  75: 0xFF8C00,     // 較高等級 (橙色)
  100: 0xD70040,    // 很高等級 (紅色)
  150: 0xFF0000,    // 最高等級 (鮮紅色)
  200: 0xFFFFFF,    // 頂尖等級 (白色)
  250: 0x00FFD0,    // 特殊等級 (青色)
  300: 0xB00000,    // 極高等級 (深紅色)
  400: 0xFF00FF     // 超高等級 (紫色)
};

// 創建用戶
exports.createUser = async (req, res) => {
  const { name, discordId } = req.body;

  if (!name || !discordId) {
    return res.status(400).json({ error: '需要名稱和ID' });
  }

  try {
    const newUser = new User({ name, discordId });
    await newUser.save();

    const levelData = getUserLevelAndExperience(newUser);
    const color = Object.entries(levelColorMap).find(([level, _]) => levelData.level <= level)[1];

    res.status(201).json({
      ...newUser._doc,
      level: levelData.level,
      color,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '使用者創建失敗' });
  }
};

// 獲取所有用戶
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();

    let usersWithLevel = users.map(user => ({ ...user._doc }))
    for (const user of usersWithLevel) {
      const levelData = getUserLevelAndExperience(user);
      const color = Object.entries(levelColorMap).find(([level, _]) => levelData.level <= level)[1];
      user.level = levelData.level;
      user.color = color;
    }
    usersWithLevel = usersWithLevel.sort((a, b) => b.level - a.level);

    res.status(200).json(usersWithLevel);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法獲取使用者' });
  }
};

// 獲取用戶
exports.getUser = async (req, res) => {
  const { discordId } = req.params;

  try {
    let user = await User.findOne({ discordId }).populate({
      path: 'equipped.tool',
      model: 'Tool',
    }).populate({
      path: 'equipped.mine',
      model: 'Mine',
    }).populate({
      path: 'equipped.pet',
      model: 'Pet',
    }).populate({
      path: 'weapons.weapon',
      model: 'Weapon',
    })
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    // 檢查是否需要補血
    if (user.lastAttackWorldBoss + 5 * 60 * 1000 < Date.now()) {
      const { level } = getUserLevelAndExperience(user);
      user.hp = level > 1 ? level * 10 + 100 : 100;
      user = await user.save();
    }

    const levelData = getUserLevelAndExperience(user);
    const color = Object.entries(levelColorMap).find(([level, _]) => levelData.level <= level)[1];

    // 添加武器品質名稱

    res.status(200).json({
      ...user._doc,
      level: levelData.level,
      weapons: user.weapons.map(w => ({
        ...w._doc,
        qualityName: getQualityName(w.quality)
      })),
      color,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法獲取使用者' });
  }
};

// 獲取用戶經驗和等級訊息
exports.getUserLevelAndExperience = async (req, res) => {
  const { discordId } = req.params;

  try {
    const user = await User.findOne({ discordId });
    const levelData = getUserLevelAndExperience(user);
    res.status(200).json(levelData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: '無法獲取用戶等級和經驗' });
  }
};