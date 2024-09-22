const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');
const formatWithThousandSeparators = require('../utils/formatWithThousandSeparators');

require('dotenv').config();

module.exports = {
  cooldown: 0,
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('購買物品')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('選擇要購買的物品')
        .addChoices(
          { name: '工具', value: 'tool' },
          { name: '礦場', value: 'mine' },
        )
    )
    .addStringOption(option =>
      option.setName('item_id')
        .setDescription('輸入要購買的物品ID')
    ),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const item = optionValue && optionValue[0] || interaction.options?.getString('item');
    const itemId = optionValue && optionValue[1] || interaction.options?.getString('item_id');
    let msg = '';

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`).catch(() => { return { data: null }; });
    if (!user.data) {
      return interaction.reply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    const buttonList = [];
    const actionRow = [];
    if (!itemId) {
      if (item === 'tool') {
        const tools = await axios.get(`${process.env.API_URL}/game/tools/${discordId}`).catch(() => { return { data: [] }; });
        tools.data.forEach(tool => {
          const disabled = tool.owned || tool.price > user.data.currency;
          const button = new ButtonBuilder()
            .setCustomId(`buy_tool_${tool._id}`)
            .setEmoji(tool.emojiId)
            .setLabel(`${tool.name} - ${tool.owned ? '已擁有' : formatWithThousandSeparators(tool.price)}`)
            .setDisabled(disabled)
            .setStyle('Primary');
          buttonList.push(button);
        });
        msg = `擁有金幣: **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n\n` +
          `${tools.data.map(tool => `<:${tool.emojiName}:${tool.emojiId}> ${tool.name} - **${tool.owned ? '已擁有' : formatWithThousandSeparators(tool.price) + ' <:coin:1271510831359852709>'}**`).join('\n')}`;
      } else if (item === 'mine') {
        const mines = await axios.get(`${process.env.API_URL}/game/mines/${discordId}`).catch(() => { return { data: [] }; });
        mines.data.forEach(mine => {
          const disabled = mine.owned || mine.price > user.data.currency;
          const button = new ButtonBuilder()
            .setCustomId(`buy_mine_${mine._id}`)
            .setEmoji(mine.emojiId)
            .setLabel(`${mine.name} - ${mine.owned ? '已擁有' : formatWithThousandSeparators(mine.price)}`)
            .setDisabled(disabled)
            .setStyle('Primary');
          buttonList.push(button);
        });
        msg = `擁有金幣: **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n\n` +
          `${mines.data.map(mine => `<:${mine.emojiName}:${mine.emojiId}> ${mine.name} - **${mine.owned ? '已擁有' : formatWithThousandSeparators(mine.price) + ' <:coin:1271510831359852709>'}**`).join('\n')}`;
      } else if (item === 'key') {
        const keyPrice = 5000;
        const keys = [
          { _id: '1', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 1', price: keyPrice },
          { _id: '5', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 5', price: keyPrice * 5 },
          { _id: '10', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 10', price: keyPrice * 10 },
          { _id: '50', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 50', price: keyPrice * 50 },
        ];
        keys.forEach(key => {
          const button = new ButtonBuilder()
            .setCustomId(`buy_key_${key._id}`)
            .setEmoji(key.emojiId)
            .setLabel(`${key.name} - ${formatWithThousandSeparators(key.price)}`)
            .setStyle('Primary');
          buttonList.push(button);
        });
        msg = `擁有金幣: **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n` +
          `擁有鑰匙: **${user.data.raffleTicket}** <:key:1274402290006233088>\n\n` +
          `${keys.map(key => `<:${key.emojiName}:${key.emojiId}> ${key.name} - **${formatWithThousandSeparators(key.price) + ' <:coin:1271510831359852709>'}**`).join('\n')}`;
      } else if (item === 'pet') {
        const pets = await axios.get(`${process.env.API_URL}/game/pets/${discordId}`).catch(() => { return { data: [] }; });
        pets.data.forEach(pet => {
          const disabled = pet.owned || pet.price > user.data.currency;
          const button = new ButtonBuilder()
            .setCustomId(`buy_pet_${pet._id}`)
            .setEmoji(pet.emojiId)
            .setLabel(`${pet.name} - ${pet.owned ? '已擁有' : formatWithThousandSeparators(pet.price)}`)
            .setDisabled(disabled)
            .setStyle('Primary');
          buttonList.push(button);
        });
        msg = `擁有金幣: **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n` +
          `寵物會在你挖礦的時候有機率把道具帶回來\n越高階的寵物，拾獲越好道具的可能性越高\n\n` +
          `${pets.data.map(pet => `<:${pet.emojiName}:${pet.emojiId}> ${pet.name} - **${pet.owned ? '已擁有' : formatWithThousandSeparators(pet.price) + ' <:coin:1271510831359852709>'}** \n \`拾獲道具機率: ${(pet.triggerProbability).toFixed(2)}% \``).join('\n')}`;
      }
      // 每一行最多5個按鈕
      while (buttonList.length) {
        const row = new ActionRowBuilder();
        for (let i = 0; i < 5; i++) {
          const button = buttonList.shift();
          if (button) {
            row.addComponents(button);
          }
        }
        actionRow.push(row);
      }
    } else {
      let res = null;
      try {
        if (item === 'tool') {
          res = await axios.post(`${process.env.API_URL}/game/buyTool`, { discordId, toolId: itemId });
        } else if (item === 'mine') {
          res = await axios.post(`${process.env.API_URL}/game/buyMine`, { discordId, mineId: itemId });
        } else if (item === 'key') {
          res = await axios.post(`${process.env.API_URL}/game/buyKey`, { discordId, num: itemId });
        } else if (item === 'pet') {
          res = await axios.post(`${process.env.API_URL}/game/buyPet`, { discordId, petId: itemId });
        }
        msg = res.data?.message;
      } catch (err) {
        msg = err?.response?.data?.error || '購買失敗';
      }
    }

    // 加入返回按鈕
    const backButton = new ButtonBuilder()
      .setCustomId('store')
      .setLabel('返回')
      .setStyle('Secondary');
    const backRow = new ActionRowBuilder().addComponents(backButton);
    actionRow.push(backRow);

    let storeName = '';
    switch (item) {
      case 'tool':
        storeName = '工具';
        break;
      case 'mine':
        storeName = '礦場';
        break;
      case 'key':
        storeName = '鑰匙';
        break;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${storeName}商店`)
      .setDescription(msg)
      .setColor(user.data.color || 0x000000);

    const lastMessage = interaction.message;
    if (lastMessage && !itemId) {
      await lastMessage.edit({
        embeds: [embed],
        components: actionRow,
      });
      return interaction.deferUpdate();
    }
    await interaction.reply({
      embeds: [embed],
      components: actionRow,
    });
  }
}