const express = require('express');
const router = express.Router();

// controllers
const { mine, listMines, listTools } = require('../controllers/gameController');

// 挖礦
router.post('/mine', mine);

// 礦場列表
router.get('/mines', listMines);

// 工具列表
router.get('/tools', listTools);

// 抽獎池列表

module.exports = router;