const crypto = require('crypto');

// 生成安全的隨機小數，並精確到小數點後兩位
const getRandomFloat = (min, max) => {
  const array = new Uint32Array(1);
  crypto.randomFillSync(array);
  const randomNumber = array[0] / (0xFFFFFFFF + 1); // 轉換為0-1之間的數字
  const result = (randomNumber * (max - min) + min).toFixed(2); // 保留兩位小數
  return parseFloat(result);
};

// 生成安全的隨機整數
const getRandomInt = (min, max) => {
	const array = new Uint32Array(1);
	crypto.randomFillSync(array);
	const randomNumber = array[0] / (0xFFFFFFFF + 1); // 轉換為0-1之間的數字
	const result = Math.floor(randomNumber * (max - min + 1) + min);
	return result;
};

// 根據物品機率隨機取得物品
const getRandomItem = (array) => {
	const totalWeight = array.reduce((acc, item) => acc + item.rarity, 0);
	const randomNum = getRandomFloat(0, totalWeight);
	let weightSum = 0;
	for (let i = 0; i < array.length; i++) {
		weightSum += array[i].rarity;
		weightSum = parseFloat(weightSum.toFixed(2));
		if (randomNum <= weightSum) {
			return array[i];
		}
	}
};

module.exports = {
	getRandomInt,
	getRandomItem,
	getRandomFloat
};