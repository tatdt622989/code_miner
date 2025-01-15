const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('weapon')
    .setDescription('武器一覽'),
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

    const actionRow = new ActionRowBuilder();

    const changeWeaponButton = new ButtonBuilder()
      .setCustomId('change-weapon')
      .setEmoji('1325128531122061479')
      .setLabel('裝備武器')
      .setStyle('Primary');
    actionRow.addComponents(changeWeaponButton);

    const strengthenWeaponButton = new ButtonBuilder()
      .setCustomId('strengthen-weapon')
      .setEmoji('1327916690981388319')
      .setLabel('強化武器')
      .setStyle('Primary');
    actionRow.addComponents(strengthenWeaponButton);

    const upgradeWeaponQualityButton = new ButtonBuilder()
      .setCustomId('upgrade-weapon-quality')
      .setEmoji('1328004628645810237')
      .setLabel('升級武器品質')
      .setStyle('Primary');
    actionRow.addComponents(upgradeWeaponQualityButton);

    const returnButton = new ButtonBuilder()
      .setCustomId('profile')
      .setLabel('返回')
      .setStyle('Secondary');
    actionRow.addComponents(returnButton);

    let msg = `擁有的武器: \n\n`;
    user.data.weapons.forEach(userWeapon => {
      msg += `<:${userWeapon.weapon.emojiName}:${userWeapon.weapon.emojiId}> ** [${userWeapon.qualityName}]** ${userWeapon.weapon.name} + ${userWeapon.level} / 攻擊力: ${userWeapon.attack.min} ~ ${userWeapon.attack.max} / 防禦力: ${userWeapon.defense.min} ~ ${userWeapon.defense.max}\n\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`${user.data.name} 的武器一覽`)
      .setDescription(msg)
      .setColor(user.data.color || 0x000000);

    await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    });
  }
}