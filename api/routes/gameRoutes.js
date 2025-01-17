const express = require('express');
const router = express.Router();

// controllers
const {
  mine,
  listMines,
  listTool,
  listTools,
  listPet,
  listPets,
  listRafflePools,
  listPotion,
  listWeapons,
  listWorldBosses,
  getCurrentWorldBoss,
  buyMine,
  buyTool,
  buyKey,
  buyPet,
  buyPotion,
  buyWeapon,
  getRafflePool,
  openChest,
  bet,
  equipWeapon,
  strengthenWeapon,
  upgradeWeaponQuality,
  attackBoss,
  claimWorldBossReward,
  checkWorldBossReward,
  checkStrengthenWeaponData
} = require('../controllers/gameController');

// 挖礦
router.get('/mine/:discordId', mine);

// 礦場列表
router.get('/mines/:discordId', listMines);

// 工具列表
router.get('/tools/:discordId', listTools);

// 寵物列表
router.get('/pets/:discordId', listPets);

// 取得特定工具
router.get('/tool/:toolId', listTool);

// 抽獎池列表
router.get('/rafflePools', listRafflePools);

// 取得特定抽獎池
router.get('/rafflePool/:poolId', getRafflePool);

// 取得特定寵物
router.get('/pet/:petId', listPet);

// 取得所有藥水資訊
router.get('/potions', listPotion);

// 武器列表
router.get('/weapons/:discordId', listWeapons);

// 世界首領列表
router.get('/worldBosses', listWorldBosses);

// 取得目前世界首領
router.get('/worldBoss', getCurrentWorldBoss);

// 購買礦場
router.post('/buyMine', buyMine);

// 購買工具
router.post('/buyTool', buyTool);

// 購買鑰匙
router.post('/buyKey', buyKey);

// 購買寵物
router.post('/buyPet', buyPet);

// 購買藥水
router.post('/buyPotion', buyPotion);

// 購買武器
router.post('/buyWeapon', buyWeapon);

// 裝備武器
router.post('/equipWeapon', equipWeapon);

// 強化武器
router.post('/strengthenWeapon', strengthenWeapon);

// 提升武器品質
router.post('/upgradeWeaponQuality', upgradeWeaponQuality);

// 開啟寶箱
router.post('/lottery/open', openChest);

// 賭博
router.post('/bet', bet);

// 攻擊世界首領
router.post('/worldBoss/attack', attackBoss);

// 獲取世界首領獎勵
router.get('/worldBoss/claimReward/:discordId', claimWorldBossReward);

// 檢查是否有未領取的世界首領獎勵
router.get('/worldBoss/checkReward/:discordId', checkWorldBossReward);

// 檢查當前強化的武器消耗的強化寶珠和品質升級套組
router.post('/checkStrengthenWeaponData', checkStrengthenWeaponData);

module.exports = router;