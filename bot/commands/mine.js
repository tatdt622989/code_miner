const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('mine')
    .setDescription('開始挖礦!'),
  async execute(interaction) {
    const discordId = interaction.user.id;

    await interaction.deferReply(); // 如果是 Slash 指令，先延遲回應

    if (interaction.bot) {
      return interaction.editReply({ content: '機器人無法挖礦', ephemeral: true });
    }

    // 檢查使用者是否存在，如果使用者不存在，創建一個新的使用者
    let pervUser = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!pervUser.data) {
      pervUser = await axios.post(`${process.env.API_URL}/users`, {
        name: interaction.user.globalName,
        discordId,
      });
    }

    // 挖礦
    const res = await axios.get(`${process.env.API_URL}/game/mine/${discordId}`);
    const {
      mineResult,
      autoMineResult,
      tool,
      isLevelUp,
      levelUpRewards,
      level,
      experience,
      nextLevelExperience,
      isDailyFirstMine,
      petReward,
      pet,
      potionInfo,
      potionEffect,
      magicHerbCollected
    } = res.data;

    // 合併物件
    const user = { ...pervUser.data, ...res.data.user };

    // 訊息輸出
    let msg = '';

    // 挖礦結果
    let totalValue = mineResult.totalValue;
    let totalExp = mineResult.totalExp;
    msg += `你挖到了 \n\n${mineResult.minerals.map(m => `<:${m.emojiName}:${m.emojiId}>  ${m.name} x ** ${m.num}**`).join('\n')}\n\n`;

    // 自動挖礦結果
    if (autoMineResult.totalValue > 0) {
      msg += `自動開採藥劑挖到了 \n\n${autoMineResult.minerals.map(m => `<:${m.emojiName}:${m.emojiId}>  ${m.name} x ** ${m.num}**`).join('\n')}\n\n`;
      totalValue += autoMineResult.totalValue;
      totalExp += autoMineResult.totalExp;
    }

    msg +=  `價值: **${totalValue}**  <:coin:1271510831359852709>\n` +
    `經驗: **${totalExp}**`;

    // 經驗條
    const expBar = `**${experience}** / **${nextLevelExperience}**`;
    msg += `\n\n等級: **${level}**\n${expBar}`;

    // 藥水效果
    let potionEffectMsg = '';
    const activePotionData = potionEffect.map((p, i) => {
      const info = potionInfo[i + 1];
      return { ...p, ...info };
    }).filter(p => p.active);
    if (activePotionData.length) {
      activePotionData.map((info, i) => {
        potionEffectMsg += `<:${info.emojiName}:${info.emojiId}> **${info.name}**`;
        if (i + 1 < activePotionData.length) potionEffectMsg += '、';
      });
      msg += (potionEffectMsg ? `\n\n**藥水效果:** \n${potionEffectMsg}` : '');
    }

    // 魔法藥草
    if (magicHerbCollected) {
      msg += `\n\n你採集到了 **${magicHerbCollected}** 個 <:magical_herb:1302301265950277673> 魔法藥草!`;
    }

    // 寵物事件
    if (petReward) {
      if (petReward.type === 'coin') {
        msg += `\n\n你的寵物 <:${pet.emojiName}:${pet.emojiId}>${pet.name} 幫你撿到了 **${petReward.value}** <:coin:1271510831359852709>!`;
      }
      if (petReward.type === 'code') {
        msg += `\n\n你的寵物 <:${pet.emojiName}:${pet.emojiId}>${pet.name} 帶回來了 <:${petReward.emojiName}:${petReward.emojiId}>**${petReward.item}** !  \`(mc物品)\``;
      }
    }

    // 如果等級提升，輸出訊息
    if (isLevelUp) {
      msg += `\n\n恭喜你升到了 **等級 ${user.level}**!\n獲得升等獎勵: **${levelUpRewards}** <:coin:1271510831359852709>`;
    }

    // 如果是每日第一次挖礦，輸出訊息
    if (isDailyFirstMine) {
      msg += '\n\n這是你今天第一次挖礦，獲得了 1 x <:key:1274402290006233088> 鑰匙!';
    }

    // 挖礦按鈕
    const button = new ButtonBuilder()
      .setCustomId('mine')
      .setEmoji(tool.emojiId)
      .setLabel('挖礦')
      .setStyle('Primary');

    // 個人資料按鈕
    const profileButton = new ButtonBuilder()
      .setCustomId('profile')
      .setEmoji('📜')
      .setLabel('個人資料')
      .setStyle('Primary');

    // 商店按鈕
    const storeButton = new ButtonBuilder()
      .setCustomId('store')
      .setEmoji('1272469167391375411')
      .setLabel('商店')
      .setStyle('Primary')

    const actionRow = new ActionRowBuilder().addComponents(button, profileButton, storeButton);

    const embed = new EmbedBuilder()
      .setTitle(interaction.user.globalName)
      .setColor(user.color || 0x686D76)
      .setDescription(msg);

    await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    });

    if (petReward && petReward.type === 'code') {
      await interaction.followUp({
        content: `恭喜你獲得了 <:${petReward.emojiName}:${petReward.emojiId}>**${petReward.item}** !\n\n 請到ReiSui伺服器中輸入\n\`\`\`/code ${petReward.code}\`\`\`\n兌換Minecraft獎品!\n請先截圖保存，未來會更新查詢獲獎記錄功能!`,
        ephemeral: true,
      });
    }
  },
};
