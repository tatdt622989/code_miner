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
          { name: '鑰匙', value: 'key' },
          { name: '寵物', value: 'pet' },
          { name: '藥水', value: 'potion' },
          { name: '武器', value: 'weapon' }
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
    const itemChildId = optionValue && optionValue[2] || interaction.options?.getString('item_child_id');

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

    const buttonList = [];
    const actionRow = [];
    let perRow = 5;
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
        msg = `擁有金幣: **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n 工具可以提升挖到礦的數量\n\n` +
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
        msg = `擁有金幣: **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n 礦場可以提升挖到礦的數量和品質\n\n` +
          `${mines.data.map(mine => `<:${mine.emojiName}:${mine.emojiId}> ${mine.name} - **${mine.owned ? '已擁有' : formatWithThousandSeparators(mine.price) + ' <:coin:1271510831359852709>'}**`).join('\n')}`;
      } else if (item === 'key') {
        const keyPrice = 5000;
        const keys = [
          { _id: '1', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 1', price: keyPrice },
          { _id: '5', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 5', price: keyPrice * 5 },
          { _id: '10', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 10', price: keyPrice * 10 },
          { _id: '50', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 50', price: keyPrice * 50 },
          { _id: '1000', emojiId: '1274402290006233088', emojiName: 'key', name: '鑰匙 x 1000', price: keyPrice * 1000 },
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
          `擁有鑰匙: **${user.data.raffleTicket}** <:key:1274402290006233088>\n 鑰匙可以用來開啟寶箱，獲得隨機的道具\n\n` +
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
      } else if (item === 'potion') {
        perRow = 3; // 每一行最多3個按鈕
        const { potionInfo, timeMap } = await axios.get(`${process.env.API_URL}/game/potions`).then(res => res.data).catch(() => []);
        // 取得藥水效果
        const {
          petTriggerProbabilityDouble = {},
          miningRewardDouble = {},
          autoMine = {},
          worldBossAttackDouble = {}
        } = user.data.potionEffect || {};
        petTriggerProbabilityDouble.active = new Date(petTriggerProbabilityDouble.end) > new Date();
        miningRewardDouble.active = new Date(miningRewardDouble.end) > new Date();
        worldBossAttackDouble.active = new Date(worldBossAttackDouble.end) > new Date();
        potionInfo[1].active = petTriggerProbabilityDouble.active;
        potionInfo[2].active = miningRewardDouble.active;
        potionInfo[3].active = autoMine.active;
        potionInfo[4].active = worldBossAttackDouble.active;
        Object.keys(potionInfo).forEach(key => {
          Object.keys(timeMap).forEach(timeKey => {
            const disabled = potionInfo[key].active || potionInfo[key].price * timeKey > user.data.magicalHerb;
            const button = new ButtonBuilder()
              .setCustomId(`buy_potion_${key}_${timeKey}`)
              .setEmoji(potionInfo[key].emojiId)
              .setLabel(`${potionInfo[key].name} - ${potionInfo[key].active ? '已使用' : timeMap[timeKey] + '分'}`)
              .setDisabled(disabled)
              .setStyle('Primary');
            buttonList.push(button);
          });
        });
        msg = `擁有魔法藥草: **${user.data.magicalHerb}** <:magical_herb:1302301265950277673>\n 藥水可以暫時提升各種效果，增加獲得道具的效率 \n` +
          `同種類藥水需等上一種效果結束後才能再次使用\n\n`;
        Object.keys(potionInfo).map(key => {
          const info = potionInfo[key];
          msg += `<:${info.emojiName}:${info.emojiId}> ${info.name}\n`;
          Object.keys(timeMap).forEach(timeKey => {
            let invalidMsg = '';
            if (info.active) {
              invalidMsg = '(使用中)';
            }
            if (info.price * timeKey > user.data.magicalHerb) {
              invalidMsg = '(魔法藥草不足)';
            }
            msg += `${timeMap[timeKey]}分 - **${formatWithThousandSeparators(info.price * timeKey)} <:magical_herb:1302301265950277673>  ${invalidMsg}** \n`;
          });
          msg += `\`效果: ${info.description}\`\n\n`;
        }).join('\n');
      } else if (item === 'weapon') {
        const weapons = await axios.get(`${process.env.API_URL}/game/weapons/${discordId}`).catch(() => { return { data: [] }; });
        weapons.data.forEach(weapon => {
          const disabled = weapon.owned || weapon.price > user.data.currency || !weapon.isAvailable;
          const button = new ButtonBuilder()
            .setCustomId(`buy_weapon_${weapon._id}`)
            .setEmoji(weapon.emojiId)
            .setLabel(`${weapon.name} - ${weapon.owned ? '已擁有' : formatWithThousandSeparators(weapon.price)}`)
            .setDisabled(disabled)
            .setStyle('Primary');
          buttonList.push(button);
        });
        msg = `擁有金幣: **${formatWithThousandSeparators(user.data.currency)}** <:coin:1271510831359852709>\n 武器可以用來攻擊世界首領 \n 強化、提升品質都可以讓武器更強 \n\n **武器化到+15以上，才能購買下一階武器** \n\n` +
        `${weapons.data.map(weapon => `<:${weapon.emojiName}:${weapon.emojiId}> ${weapon.name} - **${weapon.owned ? '已擁有' : formatWithThousandSeparators(weapon.price) + ' <:coin:1271510831359852709>'}**`).join('\n')}` +
        ` \n\n ⚠️ **購買武器後，需到 [個人資料 -> 更換武器] 裝備**`;
      }
      // 每一行按鈕數量
      while (buttonList.length) {
        const row = new ActionRowBuilder();
        for (let i = 0; i < perRow; i++) {
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
        } else if (item === 'potion') {
          res = await axios.post(`${process.env.API_URL}/game/buyPotion`, { discordId, type: itemId, timeId: itemChildId });
        } else if (item === 'weapon') {
          res = await axios.post(`${process.env.API_URL}/game/buyWeapon`, { discordId, weaponId: itemId });
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

    await interaction.editReply({
      embeds: [embed],
      components: actionRow,
    });
  }
}