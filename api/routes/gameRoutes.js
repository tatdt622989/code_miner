const express = require('express');
const router = express.Router();

// controllers
const { mine, listMines, listTool, listTools, listRafflePools, buyMine } = require('../controllers/gameController');

// 挖礦
router.get('/mine/:discordId', mine);

// 礦場列表
router.get('/mines/:discordId', listMines);

// 工具列表
router.get('/tools/:discordId', listTools);

// 特定工具
router.get('/tool/:toolId', listTool);

// 抽獎池列表
router.get('/rafflePools', listRafflePools);

// 購買礦場
router.post('/buyMine', buyMine);

module.exports = router;