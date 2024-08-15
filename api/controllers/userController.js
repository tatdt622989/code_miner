const User = require('../models/User');

// 創建用戶
exports.createUser = async (req, res) => {
  const { name, discordId } = req.body;

  if (!name || !discordId) {
    return res.status(400).json({ error: '需要名稱和ID' });
  }

  try {
    const newUser = new User({ name, discordId });
    await newUser.save();
    res.status(201).json({ message: '使用者創建成功', user: newUser });
  } catch (error) {
    res.status(500).json({ error: '使用者創建失敗' });
  }
};

// 獲取所有用戶
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: '無法獲取使用者' });
  }
};

// 獲取用戶
exports.getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: '找不到使用者' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: '無法獲取使用者' });
  }
};
