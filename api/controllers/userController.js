const { User } = require('../models/User');

const { getUserLevelAndExperience } = require('../utils/levelExperienceHandler');

const levelColorMap = {
  0: 0x686D76,
  25: 0x3795BD,
  50: 0x7C00FE,
  75: 0xF9E400,
  100: 0xF5004F,
  150: 0xFE6E00,
  200: 0xFFFFFF,
  250: 0x00ffd0,
  300: 0xb00000,
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

    const user = await User.findOne({ discordId }).populate({
      path: 'equipped.tool',
      model: 'Tool',
    }).populate({
      path: 'equipped.mine',
      model: 'Mine',
    }).populate({
      path: 'equipped.pet',
      model: 'Pet',
    })
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }

    const levelData = getUserLevelAndExperience(user);
    const color = Object.entries(levelColorMap).find(([level, _]) => levelData.level <= level)[1];

    res.status(200).json({
      ...user._doc,
      level: levelData.level,
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
