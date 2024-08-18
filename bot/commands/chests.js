const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('chests')
    .setDescription('抽寶箱'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!user.data) {
      return interaction.reply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    // 獲取寶箱列表
    const chests = await axios.get(`${process.env.API_URL}/game/rafflePools/`).catch(() => { return { data: [] }; });

    const buttonList = [];
    const actionRow = [];
    let msg = '點擊寶箱查看內容 \n\n';
    chests.data.forEach(chest => {
      const button = new ButtonBuilder()
        .setCustomId(`chest_${chest._id}`)
        .setEmoji(chest.emojiId)
        .setLabel(`${chest.name} ${chest.levelRequirement > user.data.level ? ' - 需要等級 ' + chest.levelRequirement : ''}`)
        .setDisabled(chest.levelRequirement > user.data.level)
        .setStyle('Primary');
      buttonList.push(button);
      msg += `<:${chest.emojiName}:${chest.emojiId}> ${chest.name} - ${chest.levelRequirement > user.data.level ? '需要等級 ' + chest.levelRequirement : '可開啟'}\n`;
    });

    while (buttonList.length) {
      const row = new ActionRowBuilder();
      for (let i = 0; i < 5; i++) {
        const button = buttonList.shift();
        if (button) {
          row.addComponents(button);
        }
      }
      actionRow.push(row);
    }

    const returnButton = new ButtonBuilder()
      .setCustomId('profile')
      .setLabel('返回')
      .setStyle('Secondary');
    actionRow.push(new ActionRowBuilder().addComponents(returnButton));

    const embed = new EmbedBuilder()
      .setTitle('抽寶箱')
      .setDescription(msg)
      .setColor(user.data.color || 0x000000);

    const lastMessage = interaction.message;
    if (lastMessage) {
      await lastMessage.edit({
        embeds: [embed],
        components: actionRow,
      });
      return interaction.deferUpdate();
    }
    await interaction.reply({
      embeds: [embed],
      components: actionRow,
    });
  },
};