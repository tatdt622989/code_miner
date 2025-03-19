const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('chest')
    .setDescription('寶箱內容一覽')
    .addStringOption(option =>
      option.setName('chest-id')
        .setDescription('輸入寶箱ID')
        .setRequired(true),
    ),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const chestId = optionValue && optionValue[0] || interaction.options?.getString('chest-id');

    // 判斷是按鈕互動還是指令互動，先回應延遲
    if (interaction.isButton()) {
      await interaction.deferUpdate(); // 如果是按鈕互動，先告訴 Discord 正在處理
    } else if (interaction.isChatInputCommand()) {
      await interaction.deferReply(); // 如果是 Slash 指令，先延遲回應
    }

    if (!chestId) {
      return interaction.editReply({ content: '請輸入寶箱ID', ephemeral: true });
    }

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!user.data) {
      return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    // 獲取寶箱內容
    const chest = await axios.get(`${process.env.API_URL}/game/rafflePool/${chestId}`).catch(() => { return { data: null }; });
    if (!chest.data) {
      return interaction.editReply({ content: '寶箱不存在', ephemeral: true });
    }

    const prizes = chest.data.prizes.sort((a, b) => a.rarity - b.rarity);
    const msg = `擁有的鑰匙數量: **${user.data.raffleTicket}** <:key:1274402290006233088>\n\n` +
    `寶箱內容機率: \n\n` +
    `${prizes.map(prize => `<:${prize.prize.emojiName}:${prize.prize.emojiId}> ${prize.prize.name} ${prize.prize.command ? '(MC獎品)' : ''} - **${prize.rarity}%**`).join('\n')}`;
    const embed = new EmbedBuilder()
      .setTitle(chest.data.name)
      .setDescription(msg)
      .setColor(user.data.color || 0x000000);

    const openButton = new ButtonBuilder()
      .setCustomId(`open_${chestId}`)
      .setEmoji('1274402290006233088')
      .setLabel(`消耗 ${chest.data.raffleTicket} 把鑰匙開啟`)
      .setStyle('Primary');

    const returnButton = new ButtonBuilder()
      .setCustomId('chests')
      .setLabel('返回')
      .setStyle('Secondary');

    const actionRow = new ActionRowBuilder().addComponents(openButton, returnButton);

    await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    });
  },
};