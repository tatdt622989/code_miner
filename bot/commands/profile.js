const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');
const formatWithThousandSeparators = require('../utils/formatWithThousandSeparators');

require('dotenv').config();

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('查看個人資料'),
  async execute(interaction) {
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

    // 獲取用戶經驗和等級
    const { level, experience, experienceToNextLevel, currentLevelExperience, nextLevelExperience } = (await axios.get(`${process.env.API_URL}/users/expLevel/${discordId}`)).data;
    const expBar = `**${experience}** / **${nextLevelExperience}**`;

    const userWeapon = user.data.weapons.find(w => w.weapon._id === user.data.equipped.weapon);
    const msg = `等級: **${level}**\n${expBar}\n\n` +
      `金幣 : **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n` +
      `鑰匙 : **${user.data.raffleTicket}** <:key:1274402290006233088>\n` +
      `魔法藥草 : **${user.data.magicalHerb}** <:magic_herb:1302301265950277673>\n` +
      `裝備工具 : **${user.data.equipped.tool.name}** <:${user.data.equipped.tool.emojiName}:${user.data.equipped.tool.emojiId}>\n` +
      `裝備礦場 : **${user.data.equipped.mine.name}** <:${user.data.equipped.mine.emojiName}:${user.data.equipped.mine.emojiId}>\n` +
      `裝備寵物 : ${user.data.equipped.pet ? `**${user.data.equipped.pet.name}** <:${user.data.equipped.pet.emojiName}:${user.data.equipped.pet.emojiId}>` : '無'}\n` +
      `裝備武器 : ${userWeapon ? `**${userWeapon.weapon.name}** <:${userWeapon.weapon.emojiName}:${userWeapon.weapon.emojiId}>` : '無'}`;

    // 挖礦按鈕
    const button = new ButtonBuilder()
      .setCustomId('mine')
      .setEmoji(user.data.equipped.tool.emojiId)
      .setLabel('挖礦')
      .setStyle('Primary');

    // 武器按鈕
    const weaponButton = new ButtonBuilder()
      .setCustomId('weapon')
      .setEmoji('1325076035343224944')
      .setLabel('武器')
      .setStyle('Primary');

    // 世界首領按鈕
    const bossButton = new ButtonBuilder()
      .setCustomId('worldBoss')
      .setEmoji('1325337103164506154')
      .setLabel('世界首領')
      .setStyle('Primary');

    // 商店按鈕
    const storeButton = new ButtonBuilder()
      .setCustomId('store')
      .setEmoji('1272469167391375411')
      .setLabel('商店')
      .setStyle('Primary');

    // 寶箱按鈕
    const chestsButton = new ButtonBuilder()
      .setCustomId('chests')
      .setEmoji('1272462718993170523')
      .setLabel('抽寶箱')
      .setStyle('Primary');

    // 排行榜按鈕
    const rankingButton = new ButtonBuilder()
      .setCustomId('ranking')
      .setEmoji('1275428610299134035')
      .setLabel('排行榜')
      .setStyle('Primary');

    // 以小博大按鈕
    const betButton = new ButtonBuilder()
      .setCustomId('bet')
      .setEmoji('🎲')
      .setLabel('以小博大')
      .setStyle('Primary');

    const actionRow = [
      new ActionRowBuilder().addComponents(button, storeButton, chestsButton, rankingButton, betButton),
      new ActionRowBuilder().addComponents( weaponButton, bossButton),
    ];

    // 訊息輸出
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.globalName} 的個人資料`)
      .setDescription(msg)
      .setColor(user.data.color || 0x000000)
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      components: [...actionRow],
    });
  }
}