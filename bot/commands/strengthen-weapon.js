const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 0,
  data: new SlashCommandBuilder()
    .setName('strengthen-weapon')
    .setDescription('強化武器'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const userId = optionValue && optionValue[0] || interaction.options?.getString('item_id');

    try {
      // 判斷是按鈕互動還是指令互動，先回應延遲
      if (userId) {
        await interaction.deferReply();
      } else {
        await interaction.deferUpdate();
      }

      // 獲取用戶資料
      const user = await axios.get(`${process.env.API_URL}/users/${discordId}`);
      if (!user.data) {
        throw new Error('用戶不存在，請先使用 `/mine` 創建角色');
      }

      // 判斷是否是正確的用戶
      if (user.data.discordId !== discordId) {
        throw new Error('你不是這個用戶!請到個人資料 -> 武器頁面使用');
      }

      // 獲取用戶的武器列表
      const weapons = user.data.weapons || [];
      if (weapons.length === 0) {
        throw new Error('你還沒有任何武器！\n請先到商店購買武器');
      }

      const weapon = weapons.find(w => w.weapon._id === user.data.equipped.weapon);
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
          .setCustomId('strengthen-weapon')
          .setLabel('返回')
          .setStyle('Secondary');
        actionsRow.addComponents(returnButton);

        // 取得消耗素材
        const strengthenCostRes = await axios.post(`${process.env.API_URL}/game/checkStrengthenWeaponData`, {
          discordId,
          userWeaponId: weapon._id
        });
        const strengthenPearl = strengthenCostRes.data?.cost?.pearl;

        // 強化按鈕
        const strengthenButton = new ButtonBuilder()
          .setCustomId(`strengthen-weapon_${user.data._id}`)
          .setLabel(`強化${weapon.weapon.name} (消耗 ${strengthenPearl})`)
          .setEmoji('1325305628096462950')
          .setStyle('Primary');
        actionsRow.addComponents(strengthenButton);

        await interaction.editReply({ embeds: [embed], components: [actionsRow] });
      } else {
        // 取得消耗素材
        const strengthenCostRes = await axios.post(`${process.env.API_URL}/game/checkStrengthenWeaponData`, {
          discordId,
          userWeaponId: weapon._id
        });
        const strengthenPearl = strengthenCostRes.data?.cost?.pearl || 0;
        const strengthenProbability = strengthenCostRes?.data?.probability?.pearl || 0;
        const strengthenPercent = strengthenProbability * 100;

        const embed = new EmbedBuilder()
          .setColor(user.data.color || 0x000000)
          .setTitle(`${user.data.name} 的武器強化`)
          .setDescription(`擁有的強化寶珠: **${user.data.pearl || 0}** <:pearl:1325305628096462950> \n\n 強化機率: **${strengthenPercent}%** \n\n 強化武器： \n `);

        const actionsRow = new ActionRowBuilder();;

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
      const errorMessage =  error.response?.data?.error || error.message || '無法獲取武器資訊或武器強化錯誤';

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('無法使用強化武器')
        .setDescription(errorMessage)
        .setTimestamp()

      const returnButton = new ButtonBuilder()
        .setCustomId('weapon')
        .setLabel('返回')
        .setStyle('Secondary');
      const actionRow = new ActionRowBuilder().addComponents(returnButton);

      await interaction.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
    }
  },
};