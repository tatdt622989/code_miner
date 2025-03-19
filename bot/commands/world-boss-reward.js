const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('world-boss-reward')
    .setDescription('領取世界首領獎勵'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;

    await interaction.deferReply();

    try {
      // 獲取用戶資料
      const user = await axios.get(`${process.env.API_URL}/users/${discordId}`);
      if (!user.data) {
        return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
      }

      // 檢查用戶是否可以領取獎勵
      const checkReward = await axios.get(`${process.env.API_URL}/game/worldBoss/checkReward/${discordId}`);
      if (checkReward.data) {
        const hasReward = checkReward.data.hasReward;
        if (!hasReward) {
          const embed = new EmbedBuilder()
            .setTitle(`${user.data.name} 領取世界首領獎勵`)
            .setDescription('你沒有獎勵可領取')
            .setColor(user.data.color || 0x000000)
            .setTimestamp();
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      }

      // 獲取世界首領獎勵
      const reward = await axios.get(`${process.env.API_URL}/game/worldBoss/claimReward/${discordId}`);
      if (reward.data) {
        const { pearl, qualityUpgradeSet, recievedPrizes } = reward.data;

        let itemMsg = '';
        recievedPrizes.forEach(prize => {
          itemMsg += `<:${prize.emojiName}:${prize.emojiId}> ${prize.name} ${prize.code ? `/ 序號: \`\`\`${prize.code}\`\`\`` : ''}\n`;
        });

        const actionsRow = new ActionRowBuilder();

        const returnButton = new ButtonBuilder()
          .setCustomId('profile')
          .setLabel('返回')
          .setStyle('Primary');
        actionsRow.addComponents(returnButton);

        await interaction.deleteReply();
        const embed = new EmbedBuilder()
          .setTitle(`${user.data.name} 領取世界首領獎勵`)
          .setDescription(`獲得 ${pearl} 顆<:pearl:1325305628096462950>珠寶\n獲得 ${qualityUpgradeSet} 個<:quality_set:1325383804113649734>品質升級套組\n\n獲得以下道具:\n\n ${itemMsg}`)
          .setColor(user.data.color || 0x000000)
          .setTimestamp();
        return interaction.followUp({ embeds: [embed], components: [actionsRow], ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setTitle('發生錯誤')
        .setDescription(error.message)
        .setColor(0x000000)
        .setTimestamp();
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }
  }
};