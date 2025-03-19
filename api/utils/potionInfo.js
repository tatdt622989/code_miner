const potionInfo = {
  1: { name: '寵物祝福之露', emojiId: '1302294741446033448', emojiName: 'pet_potion', price: 20, description: '寵物拾獲道具機率加倍' },
  2: { name: '礦脈祝福藥劑', emojiId: '1301906727498678342', emojiName: 'lucky_potion', price: 30, description: '挖礦獲得數量加倍' },
  3: { name: '自動開採藥劑', emojiId: '1302293310185930804', emojiName: 'doppelganger_potion', price: 30, description: '自動挖礦(效果結束後獲得礦石)' },
  4: { name: '秘法狂暴藥劑', emojiId: '1329812717631967363', emojiName: 'berserkpotion', price: 30, description: '對世界首領造成傷害增加1.5倍' },
  5: { name: '金剛藥劑', emojiId: '1342725979902185533', emojiName: 'defense_potion', price: 30, description: '提高玩家的防禦力1.5倍' }
}
Object.freeze(potionInfo);

const timeMap = {
  1: 5,
  2: 15,
  3: 30
}
Object.freeze(timeMap);

module.exports = {
  potionInfo,
  timeMap,
}