// models
const { Weapon } = require('../models/Game');

// 取得強化消耗掉具、機率、提升倍率
const getStrengthenData = (level) => {
  if (level < 11) {
    return { pearl: 1, probability: 0.5, increase: 1.1 };
  } else if (level < 21) {
    return { pearl: 2, probability: 0.20, increase: 1.2 };
  } else if (level < 31) {
    return { pearl: 3, probability: 0.1, increase: 1.23 };
  } else if (level < 41) {
    return { pearl: 4, probability: 0.04, increase: 1.25 };
  } else if (level < 51) {
    return { pearl: 5, probability: 0.005, increase: 1.3 };
  } else {
    return null;
  }
}

// 取得提升品質消耗道具、機率、提升倍率
const getQualityData = (quality) => {
  switch (quality) {
    case 1:
      return { qualityUpgradeSet: 0, probability: 0, increase: 1 };
    case 2:
      return { qualityUpgradeSet: 1, probability: 0.5, increase: 2 };
    case 3:
      return { qualityUpgradeSet: 3, probability: 0.2, increase: 4 };
    case 4:
      return { qualityUpgradeSet: 6, probability: 0.08, increase: 6 };
    case 5:
      return { qualityUpgradeSet: 12, probability: 0.03, increase: 12 };
    case 6:
      return { qualityUpgradeSet: 30, probability: 0.005, increase: 24 };
    default:
      return null;
  }
}

const getQualityName = (quality) => {
  switch (quality) {
    case 1:
      return '普通';
    case 2:
      return '稀有';
    case 3:
      return '史詩';
    case 4:
      return '傳說';
    case 5:
      return '神話';
    case 6:
      return '獨特';
    default:
      return null;
  }
}

/**
 * 取得武器攻擊力、防禦力
 * @param {*} quality 武器品質
 * @param {*} level 武器等級
 * @param {*} weaponId 武器id
 * @returns {Object} 武器攻擊力
 * @returns {number} min 最小攻擊力
 * @returns {number} max 最大攻擊力
 */
const getWeaponData = async(weaponId, quality, level) => {
  if (level < 0 || level > 100) {
    return null;
  }

  try {
    const weapons = await Weapon.find().sort({ price: 1 });
    const weaponIndex = weapons.findIndex(w => w._id.toString() === weaponId);
    if (weaponIndex === -1) {
      return null;
    }
    const weapon = weapons[weaponIndex];
    const qualityData = getQualityData(quality);
    if (!qualityData) {
      return null;
    }
    const qualityWeaponBasicAttack = {
      min: weapon.basicAttack.min * qualityData.increase,
      max: weapon.basicAttack.max * qualityData.increase
    }
    const qualityWeaponBasicDefense = {
      min: weapon.basicDefense.min * qualityData.increase,
      max: weapon.basicDefense.max * qualityData.increase
    }
    for (let i = 0; i < level; i++) {
      const strengthenData = getStrengthenData(i+1);
      if (!strengthenData) {
        return null;
      }
      qualityWeaponBasicAttack.min = (qualityWeaponBasicAttack.min * strengthenData.increase).toFixed(2);
      qualityWeaponBasicAttack.max = (qualityWeaponBasicAttack.max * strengthenData.increase).toFixed(2);
      qualityWeaponBasicDefense.min = (qualityWeaponBasicDefense.min * strengthenData.increase).toFixed(2);
      qualityWeaponBasicDefense.max = (qualityWeaponBasicDefense.max * strengthenData.increase).toFixed(2);
    }
    return { attack: qualityWeaponBasicAttack, defense: qualityWeaponBasicDefense, weaponRanking: weaponIndex + 1 };
  } catch (err) {
    console.log(err);
    return null;
  }
}

const getWeaponRequirements = (priceIndex) => {
  const requirements = [
    { strengthen: 0, quality: 0 },
    { strengthen: 15, quality: 1 },
    { strengthen: 25, quality: 2 },
    { strengthen: 35, quality: 3 },
    { strengthen: 45, quality: 4 },
    { strengthen: 50, quality: 5 },
  ]
  return requirements[priceIndex] || null;
}

module.exports = { getStrengthenData, getQualityData, getWeaponData, getQualityName, getWeaponRequirements };