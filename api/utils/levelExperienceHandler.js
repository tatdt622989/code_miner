const baseValue = 100; // 可調整的基礎值
const growthFactor = 1.7; // 可調整的增長因子
const maxLevel = 400; // 最大等級

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
          return level - 1; // 經驗未達到下一等級時返回當前等級
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

// 取得升等獎勵，越高等級金幣越多
// 基礎獎勵1000金幣
// 1 - 25等，每個等級比前一個等級多200金幣
// 26 - 50等，每個等級比前一個等級多500
// 51 - 75等，每個等級比前一個等級多1000金幣
// 76 - 100等，每個等級比前一個等級多2000金幣
function getLevelUpRewards(level) {
  if (level <= 25) {
      return 1000 + 200 * level;
  } else if (level <= 50) {
      return 1000 + 200 * 25 + 500 * (level - 25);
  } else if (level <= 75) {
      return 1000 + 200 * 25 + 500 * 25 + 750 * (level - 50);
  } else {
      return 1000 + 200 * 25 + 500 * 25 + 1000 * 25 + 1250 * (level - 75);
  }
}

// 取得用戶等級和經驗
function getUserLevelAndExperience(user) {
  if (!user) return null;
  const experience = user.experience;
  const level = getLevelForExperience(experience, experienceTable); // 使用經驗表計算等級
  const experienceToNextLevel = getExperienceToNextLevel(level, experience, experienceTable);
  const currentLevelExperience = experienceTable[level];
  const nextLevelExperience = experienceTable[level + 1] || currentLevelExperience;
  const levelUpRewards = getLevelUpRewards(level);
  return { level, experience, experienceToNextLevel, currentLevelExperience, nextLevelExperience, levelUpRewards };
}

module.exports = {
  getUserLevelAndExperience
}