const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUser, getUserLevelAndExperience } = require('../controllers/userController');

// 創建用戶
router.post('/', createUser);

// 獲取所有用戶
router.get('/', getUsers);

// 獲取用戶
router.get('/:discordId', getUser);

// 獲取用戶經驗和等級
router.get('/expLevel/:discordId', getUserLevelAndExperience);

module.exports = router;
