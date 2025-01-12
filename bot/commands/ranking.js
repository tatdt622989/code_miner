const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('排行榜'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;

    try {
      // 判斷是按鈕互動還是指令互動，先回應延遲
      if (interaction.isButton()) {
        await interaction.deferUpdate(); // 如果是按鈕互動，先告訴 Discord 正在處理
      } else if (interaction.isChatInputCommand()) {
        await interaction.deferReply(); // 如果是 Slash 指令，先延遲回應
      }

      // 獲取用戶資料，限制15名
      const res = await axios.get(`${process.env.API_URL}/users`).catch(() => { return { data: [] }; });

      if (!res.data.length) {
        return interaction.editReply({ content: '空', ephemeral: true });
      }

      const users = res.data.slice(0, 15);

      const msg = `<:leaderboard:1275428610299134035> 排行榜: \n\n${users.map((user, index) => `${index + 1}. **${user.name}** - 等級: ${user.level} 經驗: ${user.experience}`).join('\n')}`;

      const user = res.data.find(user => user.discordId === discordId);

      const embed = new EmbedBuilder()
        .setTitle('排行榜')
        .setDescription(msg)
        .setColor(user.color || 0x000000)
        .setTimestamp();

      const returnButton = new ButtonBuilder()
        .setCustomId('profile')
        .setLabel('返回')
        .setStyle('Secondary');

      const actionRow = new ActionRowBuilder().addComponents(returnButton);

      await interaction.editReply({ embeds: [embed], components: [actionRow] });
    } catch (error) {
      console.error(error);
      return interaction.editReply({ content: '錯誤', ephemeral: true });
    }
  }
};