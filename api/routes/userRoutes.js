const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUser } = require('../controllers/userController');

// 創建用戶
router.post('/', createUser);

// 獲取所有用戶
router.get('/', getUsers);

// 獲取用戶
router.get('/:id', getUser);

module.exports = router;
