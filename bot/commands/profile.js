const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('查看個人資料'),
  async execute(interaction) {
    const discordId = interaction.user.id;

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!user.data) {
      return interaction.reply({ content: '用戶不存在', ephemeral: true });
    }

    // 獲取用戶經驗和等級
    const { level, experience, experienceToNextLevel, currentLevelExperience, nextLevelExperience } = (await axios.get(`${process.env.API_URL}/users/expLevel/${discordId}`)).data;
    const expBar = `**${experience}** / **${nextLevelExperience}**`;

    const msg = `等級: **${level}**\n${expBar}\n\n`+
    `金幣 : **${user.data.currency}** <:coin:1271510831359852709>\n`+
    `鑰匙 : **${user.data.raffleTicket}** <:key:1274402290006233088>\n`+
    `裝備工具 : **${user.data.equipped.tool.name}** <:${user.data.equipped.tool.emojiName}:${user.data.equipped.tool.emojiId}>\n`+
    `裝備礦場 : **${user.data.equipped.mine.name}** <:${user.data.equipped.mine.emojiName}:${user.data.equipped.mine.emojiId}>`;

    // 挖礦按鈕
    const button = new ButtonBuilder()
      .setCustomId('mine')
      .setEmoji(user.data.equipped.tool.emojiId)
      .setLabel('挖礦')
      .setStyle('Primary');

    const actionRow = new ActionRowBuilder().addComponents(button);

    // 訊息輸出
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.globalName} 的個人資料`)
      .setDescription(msg)
      .setColor(user.data.color || 0x000000)
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });
  }
}