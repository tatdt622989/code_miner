const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('open')
    .setDescription('開啟寶箱')
    .addStringOption(option =>
      option.setName('item_id')
        .setDescription('輸入要開啟的寶箱ID')
    ),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const itemId = optionValue && optionValue[0] || interaction.options?.getString('item_id');

    // 判斷是按鈕互動還是指令互動，先回應延遲
    await interaction.deferReply();

    if (!itemId) {
      return interaction.editReply({ content: '請輸入寶箱ID', ephemeral: true });
    }

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!user.data) {
      return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    try {
      // 獲取寶箱內容
      const chest = await axios.get(`${process.env.API_URL}/game/rafflePool/${itemId}`);

      if (!chest.data) {
        return interaction.editReply({ content: '寶箱不存在', ephemeral: true });
      }

      // 檢查使用者等級
      if (user.data.level < chest.data.levelRequirement) {
        return interaction.editReply({ content: `等級不足，需要等級 ${chest.data.levelRequirement}`, ephemeral: true });
      }

      // 獲取寶箱內容
      const openChest = await axios.post(`${process.env.API_URL}/game/lottery/open`, { discordId, chestId: itemId });

      const prize = openChest.data.prize.prize;
      let msg = '';
      if (prize.command) {
        const code = openChest.data.code;
        msg = `恭喜你獲得了 <:${prize.emojiName}:${prize.emojiId}> **${prize.name}** \n\n請到ReiSui伺服器中輸入\n\`\`\`/code ${code}\`\`\`\n兌換Minecraft獎品!`;
      } else {
        msg = `恭喜你獲得了 <:${prize.emojiName}:${prize.emojiId}> **${prize.name}** \n\n 金幣 x **${prize.value}**`;
      }

      const embed = new EmbedBuilder()
        .setTitle(`你開啟了   <:${chest.data.emojiName}:${chest.data.emojiId}> ${chest.data.name}`)
        .setDescription(msg)
        .setColor(user.data.color || 0x000000);

      const returnButton = new ButtonBuilder()
        .setCustomId('chests')
        .setLabel('返回')
        .setStyle('Secondary');

      const tryAgainButton = new ButtonBuilder()
        .setCustomId(`open_${itemId}`)
        .setLabel('再次開啟')
        .setStyle('Primary');

      const actionRow = new ActionRowBuilder().addComponents(returnButton, tryAgainButton);

      await interaction.editReply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
    } catch (error) {
      console.log(error);
      return interaction.editReply({ content: error?.response?.data?.error || '開啟失敗', ephemeral: true });
    }
  }
};
