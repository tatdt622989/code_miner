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
      // 獲取用戶資料，限制15名
      const res = await axios.get(`${process.env.API_URL}/users`).catch(() => { return { data: [] }; });

      if (!res.data.length) {
        return interaction.reply({ content: '空', ephemeral: true });
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

      const lastMessage = interaction.message;
      if (lastMessage) {
        await lastMessage.edit({
          content: null,
          embeds: [embed],
          components: [actionRow],
        });
      } else {
        await interaction.reply({ embeds: [embed], components: [actionRow] });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '錯誤', ephemeral: true });
    }
  }
};