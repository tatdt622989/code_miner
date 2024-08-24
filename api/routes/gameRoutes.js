const express = require('express');
const router = express.Router();

// controllers
const { mine, listMines, listTool, listTools, listRafflePools, buyMine, buyTool, buyKey, getRafflePool, openChest, bet } = require('../controllers/gameController');

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

// 特定抽獎池
router.get('/rafflePool/:poolId', getRafflePool);

// 購買礦場
router.post('/buyMine', buyMine);

// 購買工具
router.post('/buyTool', buyTool);

// 購買鑰匙
router.post('/buyKey', buyKey);

// 開啟寶箱
router.post('/lottery/open', openChest);

// 賭博
router.post('/bet', bet);

module.exports = router;