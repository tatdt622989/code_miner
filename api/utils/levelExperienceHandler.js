// model
const { User } = require('../models/User');

const baseValue = 100; // 可調整的基礎值
const growthFactor = 1.2; // 可調整的增長因子
const maxLevel = 100; // 最大等級

// 打印等級經驗表
const experienceTable = generateExperienceTable(baseValue, growthFactor);

// 生成等級經驗表
function generateExperienceTable() {
  const experienceTable = {};
  let totalExperience = 0;

  for (let level = 1; level <= maxLevel; level++) {
      const experienceForThisLevel = calculateExperienceForLevel(level);
      totalExperience += experienceForThisLevel;
      experienceTable[level] = totalExperience;
  }

  return experienceTable;
}

// 計算等級對應的經驗
function calculateExperienceForLevel(level) {
  if (level === 1) return 0; // 等級1不需要經驗
  return Math.floor(baseValue * Math.pow(level, growthFactor));
}

// 根據經驗計算等級
function getLevelForExperience(experience, experienceTable) {
  for (let level = 1; level <= maxLevel; level++) {
      if (experience < experienceTable[level]) {
          return level;
      }
  }
  return maxLevel; // 達到或超過表中最大等級時返回最大等級
}

// 根據當前等級和經驗計算升級所需經驗
function getExperienceToNextLevel(currentLevel, currentExperience, experienceTable) {
  if (currentLevel >= maxLevel) return 0; // maxLevel後不再增加等級
  const experienceForNextLevel = experienceTable[currentLevel + 1];
  return experienceForNextLevel - currentExperience;
}

// 取得用戶等級和經驗
async function getUserLevelAndExperience(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('找不到使用者');
  }
  const experience = user.experience;
  const level = getLevelForExperience(experience, experienceTable); // 使用經驗表計算等級
  const experienceToNextLevel = getExperienceToNextLevel(level, experience, experienceTable);
  const currentLevelExperience = experienceTable[level];
  return { level, experience, experienceToNextLevel, currentLevelExperience };
}

module.exports = {
  getUserLevelAndExperience
}