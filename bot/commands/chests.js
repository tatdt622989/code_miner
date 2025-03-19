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

    await interaction.editReply({
      embeds: [embed],
      components: actionRow,
    });
  },
};