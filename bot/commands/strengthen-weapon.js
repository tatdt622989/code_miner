const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('strengthen-weapon')
    .setDescription('強化武器'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const userId = optionValue && optionValue[0] || interaction.options?.getString('item_id');

    // 判斷是按鈕互動還是指令互動，先回應延遲
    await interaction.deferReply(); // 如果是 Slash 指令，先延遲回應

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`);
    if (!user.data) {
      return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    // 判斷是否是正確的用戶
    if (user.data.discordId !== discordId) {
      return interaction.editReply({ content: '你不是這個用戶!請到個人資料 -> 武器頁面使用', ephemeral: true });
    }

    // 獲取用戶的武器列表
    const weapons = user.data.weapons || [];
    if (weapons.length === 0) {
      return interaction.editReply({ content: '你還沒有任何武器！', ephemeral: true });
    }

    const weapon = weapons.find(w => w.weapon._id === user.data.equipped.weapon);

    try {
      if (userId) { // 強化
        const response = await axios.post(`${process.env.API_URL}/game/strengthenWeapon`, {
          discordId,
          userWeaponId: weapon._id
        });

        const thumbnail = response.data.success ? `https://cdn.discordapp.com/emojis/1327917184084738139.png?v=1` : `https://cdn.discordapp.com/emojis/1327917239231451209.png?v=1`;

        const embed = new EmbedBuilder()
          .setColor(user.data.color || 0x000000)
          .setTitle('武器強化')
          .setDescription(response.data.message)
          .setTimestamp()
          .setThumbnail(thumbnail);

        const actionsRow = new ActionRowBuilder();

        const returnButton = new ButtonBuilder()
          .setCustomId('weapon')
          .setLabel('返回')
          .setStyle('Secondary');
        actionsRow.addComponents(returnButton);

        await interaction.editReply({ embeds: [embed], components: [actionsRow] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(user.data.color || 0x000000)
          .setTitle('武器強化')
          .setDescription(`擁有的強化寶珠: **${user.data.pearl || 0}** <:pearl:1325305628096462950> \n\n 強化武器： \n `);

        const actionsRow = new ActionRowBuilder();

        // 取得消耗素材
        const strengthenCostRes = await axios.post(`${process.env.API_URL}/game/checkStrengthenWeaponCost`, {
          discordId,
          userWeaponId: weapon._id
        });
        const strengthenPearl = strengthenCostRes.data.pearl;

        // 強化按鈕
        const strengthenButton = new ButtonBuilder()
          .setCustomId(`strengthen-weapon_${user.data._id}`)
          .setLabel(`強化${weapon.weapon.name} (消耗 ${strengthenPearl})`)
          .setEmoji('1325305628096462950')
          .setStyle('Primary');
        actionsRow.addComponents(strengthenButton);

        // 返回按鈕
        const returnButton = new ButtonBuilder()
          .setCustomId('weapon')
          .setLabel('返回')
          .setStyle('Secondary');
        actionsRow.addComponents(returnButton);

        // 添加武器資訊到embed
        embed.addFields({
          name: `**[${weapon.qualityName}] ${weapon.weapon.name} +${weapon.level}** \n`,
          value: `攻擊力: ${weapon.attack.min} ~ ${weapon.attack.max}\n防禦力: ${weapon.defense.min} ~ ${weapon.defense.max}`,
          inline: true
        });

        const thumbnail = `https://cdn.discordapp.com/emojis/${weapon.weapon.emojiId}.png?v=1`;
        embed.setThumbnail(thumbnail);

        // footer
        embed.setFooter({
          text: '若要強化其他武器，請先到個人資料 -> 武器 -> 裝備武器頁面，更換要強化的武器'
        });

        await interaction.editReply({
          embeds: [embed],
          components: [actionsRow]
        });
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || '無法獲取武器資訊或武器強化錯誤';

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('錯誤')
        .setDescription(errorMessage)
        .setTimestamp()

      const returnButton = new ButtonBuilder()
        .setCustomId('strengthen-weapon')
        .setLabel('返回')
        .setStyle('Secondary');
      const actionRow = new ActionRowBuilder().addComponents(returnButton);

      await interaction.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
    }
  },
};