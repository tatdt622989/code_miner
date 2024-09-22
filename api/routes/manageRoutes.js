const express = require('express');
const router = express.Router();

// controllers
const {
  addMineral,
  updateMineral,
  addMine,
  updateMine,
  addTool,
  updateTool,
  addPet,
  updatePet,
  addPrize,
  updatePrize,
  addRafflePool,
  addRafflePoolPrize
} = require('../controllers/manageController');

// 新增礦物
router.post('/mineral', addMineral);

// 更新礦物
router.put('/mineral/:id', updateMineral);

// 新增礦場
router.post('/mine', addMine);

// 更新礦場
router.put('/mine/:id', updateMine);

// 新增工具
router.post('/tool', addTool);

// 更新工具
router.put('/tool/:id', updateTool);

// 新增寵物
router.post('/pet', addPet);

// 更新寵物
router.put('/pet/:id', updatePet);

// 新增獎品
router.post('/price', addPrize);

// 更新獎品
router.put('/price/:id', updatePrize);

// 新增抽獎池
router.post('/rafflePool', addRafflePool);

// 新增抽獎池的獎品
router.post('/rafflePool/prize', addRafflePoolPrize);

module.exports = router;