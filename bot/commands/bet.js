const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('bet')
    .setDescription('以小博大')
    .addStringOption(option =>
      option.setName('magnification')
        .setDescription('選擇倍率')
        .addChoices(
          { name: '2倍(50%)', value: '2' },
          { name: '3倍(25%)', value: '3' },
          { name: '5倍(12.5%)', value: '5' },
        )
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('下注金額')
    ),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const amount = optionValue && optionValue[0] || interaction.options?.getInteger('amount');
    const magnification = optionValue && optionValue[1] || interaction.options?.getString('magnification');
    let msg = '';
    const actionRow = new ActionRowBuilder();
    const embed = new EmbedBuilder()

    console.log('amount', amount, 'magnification', magnification);

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!user.data) {
      return interaction.reply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    if (!amount && !magnification) {
      msg = ` 請選擇下注金額和倍率\n\n` +
        `擁有金幣: **${user.data.currency}** <:coin:1271510831359852709>\n\n` +
      `倍率 \`2\` 倍，獲勝機率 \`50%\`\n` +
        `倍率 \`3\` 倍，獲勝機率 \`25%\`\n` +
        `倍率 \`5\` 倍，獲勝機率 \`12.5%\`\n\n` +
        `使用方法: 例 \`\`\`/bet\`\`\` \n` +
        `### 按\`Tab\`鍵選擇倍率，輸入金額後按\`Enter\`鍵確認下注\n\n`;

      embed.setTitle('<:afewofcoin:1272914593924255805>以小博大<:afewofcoin:1272914593924255805>');
      embed.setDescription(msg);
      embed.setColor(user.data.color || 0x000000);
    } else {
      if (amount < 1000) {
        return interaction.reply({ content: '下注金額不能低於1000', ephemeral: true });
      }
      if (amount > user.data.currency) {
        return interaction.reply({ content: '金幣不足', ephemeral: true });
      }
      if (Number.isNaN(amount)) {
        return interaction.reply({ content: '請輸入數字', ephemeral: true });
      }

      try {
        const res = await axios.post(`${process.env.API_URL}/game/bet`, { discordId, amount, magnification: Number(magnification) });
        let thumbnail = 'https://cdn.discordapp.com/emojis/1276793095974817913.png?v=1';
        if (res.data.isWin) {
          msg = `恭喜你獲勝了!\n **金幣 + ${amount * Number(magnification) - amount}  <:coin:1271510831359852709>**`;
        } else {
          msg = `很遺憾，你輸了!\n  **金幣 - ${amount}  <:coin:1271510831359852709>**`;
          thumbnail = 'https://cdn.discordapp.com/emojis/1276803332115009536.png?v=1';
        }
        embed.setTitle('以小博大')
          .setDescription(msg)
          .setColor(user.data.color || 0x000000)
          .setThumbnail(thumbnail);
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: error.response.data.message, ephemeral: true });
      }

    }

    const returnButton = new ButtonBuilder()
      .setCustomId('profile')
      .setLabel('返回')
      .setStyle('Secondary');

    actionRow.addComponents(returnButton);

    const lastMessage = interaction.message;
    if (lastMessage && !amount && !magnification) {
      await lastMessage.edit({
        embeds: [embed],
        components: [actionRow],
      });
      return interaction.deferUpdate();
    }
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });
  }
}
