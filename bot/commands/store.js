const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('store')
    .setDescription('商店'),
  async execute(interaction) {
    const discordId = interaction.user.id;

    // 判斷是按鈕互動還是指令互動，先回應延遲
    if (interaction.isButton()) {
      await interaction.deferUpdate(); // 如果是按鈕互動，先告訴 Discord 正在處理
    } else if (interaction.isChatInputCommand()) {
      await interaction.deferReply(); // 如果是 Slash 指令，先延遲回應
    }

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!user.data) {
      return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    const msg = `商城使用方式: \n\n` +
      `<:pickaxe:1271797839483244597> 購買工具: /buy tool \n` +
      `<:mine5:1272564469154971785> 購買礦場: /buy mine \n` +
      `<:key:1274402290006233088> 購買鑰匙: /buy key \n` +
      `<:magic_herb:1302301265950277673> 購買藥草: /buy potion \n` +
      `<:afewofcoin:1283811816509800458> 購買寵物: /buy pet \n` +
      `<:afewofcoin:1325076035343224944> 購買武器: /buy weapon \n` +
      `或使用下方按鈕購買`;

    const embed = new EmbedBuilder()
      .setTitle('商店')
      .setDescription(msg)
      .setColor(user.data.color || 0x000000)

    const toolButton = new ButtonBuilder()
      .setCustomId('buy_tool')
      .setEmoji('1271797839483244597')
      .setLabel('購買工具')
      .setStyle('Primary');

    const mineButton = new ButtonBuilder()
      .setCustomId('buy_mine')
      .setEmoji('1272564469154971785')
      .setLabel('購買礦場')
      .setStyle('Primary');

    const petButton = new ButtonBuilder()
      .setCustomId('buy_pet')
      .setEmoji('1283811816509800458')
      .setLabel('購買寵物')
      .setStyle('Primary');

    const keyButton = new ButtonBuilder()
      .setCustomId('buy_key')
      .setEmoji('1274402290006233088')
      .setLabel('購買鑰匙')
      .setStyle('Primary');

    const potionButton = new ButtonBuilder()
      .setCustomId('buy_potion')
      .setEmoji('1302294741446033448')
      .setLabel('購買藥水')
      .setStyle('Primary');

    const weaponButton = new ButtonBuilder()
      .setCustomId('buy_weapon')
      .setEmoji('1325076035343224944')
      .setLabel('購買武器')
      .setStyle('Primary');

    const returnButton = new ButtonBuilder()
      .setCustomId('profile')
      .setLabel('返回')
      .setStyle('Secondary');

    const actionRow = [
      new ActionRowBuilder().addComponents(toolButton, mineButton, petButton, keyButton, potionButton),
      new ActionRowBuilder().addComponents(weaponButton)
    ];

    if (interaction.isButton()) {
      await interaction.editReply({
        embeds: [embed],
        components: [...actionRow, new ActionRowBuilder().addComponents(returnButton)],
      });
    } else if (interaction.isChatInputCommand()) {
      await interaction.editReply({
        embeds: [embed],
        components: [...actionRow],
      });
    }
  }
}