const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 0,
  data: new SlashCommandBuilder()
    .setName('change-weapon')
    .setDescription('更換裝備武器'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;

    try {
      // 判斷是按鈕互動還是指令互動，先回應延遲
      if (interaction.isButton()) {
        await interaction.deferUpdate();
      } else if (interaction.isChatInputCommand()) {
        await interaction.deferReply();
      }

      // 獲取用戶資料
      const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
      if (!user.data) {
        return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
      }

      // 檢查用戶是否擁有武器
      if (!user.data.weapons || user.data.weapons.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('無法更換武器')
          .setDescription('你還沒有任何武器！\n 可以使用到商店購買武器')
          .setColor(0xFF0000);

        // 返回按鈕
        const returnButton = new ButtonBuilder()
          .setCustomId('weapon')
          .setLabel('返回')
          .setStyle('Secondary');

        const actionRow = new ActionRowBuilder().addComponents(returnButton);

        return interaction.editReply({
          embeds: [embed],
          components: [actionRow],
        });
      }

      // 處理下拉選單回應
      if (interaction.isStringSelectMenu()) {
        const selectedWeaponId = optionValue && optionValue[0] || interaction.values[0];
        const selectedWeapon = user.data?.weapons.find(weapon => weapon.weapon._id === selectedWeaponId);

        if (selectedWeapon) {
          const req = {
            discordId,
            weaponId: selectedWeaponId
          };
          try {
            await axios.post(`${process.env.API_URL}/game/equipWeapon`, req);

            const embed = new EmbedBuilder()
              .setTitle('更換武器成功')
              .setDescription(`已裝備 <:${selectedWeapon.weapon.emojiName}:${selectedWeapon.weapon.emojiId}> **[${selectedWeapon.qualityName}] ${selectedWeapon.weapon.name} +${selectedWeapon.level}**\n\n攻擊: ${selectedWeapon.attack.min} ~ ${selectedWeapon.attack.max}\n防禦: ${selectedWeapon.defense.min} ~ ${selectedWeapon.defense.max}`)
              .setColor(user.data.color || 0x000000);

            const returnButton = new ButtonBuilder()
              .setCustomId('weapon')
              .setLabel('返回')
              .setStyle('Secondary');

            const actionRow = new ActionRowBuilder().addComponents(returnButton);

            return interaction.update({
              embeds: [embed],
              components: [actionRow],
            });
          } catch (error) {
            console.error(error);
            return interaction.update({
              content: error?.response?.data?.error || '更換武器失敗',
              embeds: [],
              components: [],
              ephemeral: true
            });
          }
        } else {
          return interaction.update({
            content: '找不到選擇的武器',
            embeds: [],
            components: [],
            ephemeral: true
          });
        }
      }

      // 創建下拉選單
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_weapon')
        .setPlaceholder('選擇要裝備的武器');

      // 添加武器選項
      if (user.data?.weapons && user.data.weapons.length > 0) {
        user.data?.weapons.forEach(userWeapon => {
          const isCurrentlyEquipped = user.data.equipped?.weapon === userWeapon.weapon._id;
          selectMenu.addOptions({
            label: `${isCurrentlyEquipped ? '(裝備中) ' : ''}[${userWeapon.qualityName}] ${userWeapon.weapon.name} +${userWeapon.level}`,
            description: `攻擊力: ${userWeapon.attack.min} ~ ${userWeapon.attack.max} / 防禦力: ${userWeapon.defense.min} ~ ${userWeapon.defense.max}`,
            value: `change-weapon_${userWeapon.weapon._id}`,
            emoji: {
              name: userWeapon.weapon.emojiName,
              id: userWeapon.weapon.emojiId
            },
            default: isCurrentlyEquipped
          });
        });
      }

      const returnButton = new ButtonBuilder()
        .setCustomId('weapon')
        .setLabel('返回')
        .setStyle('Secondary');

      const actionRow = new ActionRowBuilder().addComponents(selectMenu);
      const buttonRow = new ActionRowBuilder().addComponents(returnButton);

      const embed = new EmbedBuilder()
        .setTitle('更換武器')
        .setDescription('請選擇要裝備的武器')
        .setColor(user.data.color || 0x000000);

      const response = {
        embeds: [embed],
        components: [actionRow, buttonRow],
      };

      if (interaction.deferred) {
        await interaction.editReply(response);
      } else {
        await interaction.update(response);
      }

    } catch (error) {
      console.error(error);
      let errorMessage = '發生錯誤，請稍後再試';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = `錯誤：${error.message}`;
      }

      const errorEmbed = new EmbedBuilder()
        .setTitle('錯誤')
        .setDescription(errorMessage)
        .setColor(0xFF0000);

      const errorResponse = {
        embeds: [errorEmbed],
        ephemeral: true
      };

      if (interaction.deferred) {
        await interaction.editReply(errorResponse);
      } else {
        await interaction.update(errorResponse);
      }
    }
  }
};