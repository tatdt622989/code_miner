const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 0,
  data: new SlashCommandBuilder()
    .setName('upgrade-weapon-quality')
    .setDescription('升級武器品質'),
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
        const response = await axios.post(`${process.env.API_URL}/game/upgradeWeaponQuality`, {
          discordId,
          userWeaponId: weapon._id
        });

        const thumbnail = response.data.success ? `https://cdn.discordapp.com/emojis/1327916584357990464.png?v=1` : `https://cdn.discordapp.com/emojis/1327917239231451209.png?v=1`;

        const embed = new EmbedBuilder()
        .setColor(user.data.color || 0x000000)
        .setTitle('武器品質升級')
        .setDescription(response.data.message)
        .setTimestamp()
        .setThumbnail(thumbnail);

        const actionsRow = new ActionRowBuilder();

        const returnButton = new ButtonBuilder()
          .setCustomId('upgrade-weapon-quality')
          .setLabel('返回')
          .setStyle('Secondary');
        actionsRow.addComponents(returnButton);

        // 取得消耗素材
        const costRes = await axios.post(`${process.env.API_URL}/game/checkStrengthenWeaponData`, {
          discordId,
          userWeaponId: weapon._id
        });
        const qualityUpgradeSet = costRes.data?.cost?.qualityUpgradeSet || 0;

        // 強化按鈕
        const strengthenButton = new ButtonBuilder()
          .setCustomId(`upgrade-weapon-quality_${user.data._id}`)
          .setLabel(`升級${weapon.weapon.name} (消耗 ${qualityUpgradeSet})`)
          .setEmoji('1325383804113649734')
          .setStyle('Primary');
        actionsRow.addComponents(strengthenButton);

        await interaction.editReply({ embeds: [embed], components: [actionsRow] });
      } else {
        // 取得消耗素材
        const costRes = await axios.post(`${process.env.API_URL}/game/checkStrengthenWeaponData`, {
          discordId,
          userWeaponId: weapon._id
        });
        const qualityUpgradeSet = costRes.data?.cost?.qualityUpgradeSet || 0;
        const qualityProbability = costRes.data?.probability?.qualityUpgradeSet || 0;
        const qualityPercent = qualityProbability * 100;

        const embed = new EmbedBuilder()
          .setColor(user.data.color || 0x000000)
          .setTitle(`${user.data.name} 的武器品質升級`)
          .setDescription(`擁有的強化升級模組: **${user.data.qualityUpgradeSet || 0}** <:quality_set:1325383804113649734> \n\n 強化機率: **${qualityPercent}%** \n\n 品質升級武器： \n `);

        const actionsRow = new ActionRowBuilder();

        // 強化按鈕
        const strengthenButton = new ButtonBuilder()
          .setCustomId(`upgrade-weapon-quality_${user.data._id}`)
          .setLabel(`升級${weapon.weapon.name} (消耗 ${qualityUpgradeSet})`)
          .setEmoji('1325383804113649734')
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
          text: '若要升級其他武器，請先到個人資料 -> 武器 -> 裝備武器頁面，更換要升級的武器'
        });

        await interaction.editReply({
          embeds: [embed],
          components: [actionsRow]
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || '無法獲取武器資訊或武器升級錯誤';

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('無法使用武器品質升級')
        .setDescription(errorMessage)
        .setTimestamp()

      const returnButton = new ButtonBuilder()
        .setCustomId('weapon')
        .setLabel('返回')
        .setStyle('Secondary');
      const actionRow = new ActionRowBuilder().addComponents(returnButton);

      await interaction.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
    }
  }
};