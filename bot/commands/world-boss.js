const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('world-boss')
    .setDescription('世界首領'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const typeId = optionValue && optionValue[0];

    await interaction.deferReply();

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`);
    if (!user.data) {
      return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    // 取得當前的世界首領資料
    const boss = await axios.get(`${process.env.API_URL}/game/worldBoss`).catch(() => { return { data: null }; });
    if (!boss.data) {
      const embed = new EmbedBuilder()
        .setTitle('世界首領')
        .setDescription('目前沒有世界首領出現')
        .setColor(0x000000)
        .setTimestamp();
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    // 設定世界首領品質顏色，共6種，由弱到強
    const bossQualityColor = (quality) => {
      switch (quality) {
        case 1:
          return 0xA0A0A0;
        case 2:
          return 0x1E90FF;
        case 3:
          return 0x8A2BE2;
        case 4:
          return 0xFFA500;
        case 5:
          return 0xFF4500;
        case 6:
          return 0xFFD700;
        default:
          return 0xA0A0A0;
      }
    }

    const expireTime = new Date(boss.data.expireTime);
    const leftTime = Math.ceil((expireTime.getTime() - Date.now()) / 1000);
    const formatTime = (time) => {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = time % 60;
      return `${hours} 小時 ${minutes} 分鐘 ${seconds} 秒`;
    }

    const formatNumber = (num) => num.toLocaleString(); // 將數字格式化為千分位顯示

    const hpUI = (currentHp, maxHp) => {
      const barLength = 20; // 血條長度
      const hpRatio = currentHp / maxHp; // 計算血量比例
      const filledBars = Math.floor(hpRatio * barLength); // 滿血條格數
      const emptyBars = barLength - filledBars; // 空血條格數
      const hpBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars); // 血條顯示
      return `[${hpBar}] \n **${formatNumber(currentHp)}** / ${formatNumber(maxHp)}`; // 組合顯示結果
    };

    const users = await axios.get(`${process.env.API_URL}/users`).catch(() => { return { data: null }; });
    if (!users.data) {
      return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    const getAllUserDamageRankingUI = (participatingUsers) => {
      const sortedUserDamage = participatingUsers.sort((a, b) => b.userDamage - a.userDamage);
      return sortedUserDamage.map((user, index) => {
        const rank = index + 1;
        const damage = formatNumber(user.userDamage);
        const userName = users.data.find(item => item._id === user.user).name;
        console.log(userName);
        return `${rank}. ${userName} - ${damage} 傷害`;
      }).join('\n');
    }

    const feields = [];
    feields.push({ name: '血量', value:hpUI(boss.data.remainingHp, boss.data.hp) });
    if (boss.data.participatingUsers.length > 0) {
      feields.push({ name: '傷害排行榜', value:getAllUserDamageRankingUI(boss.data.participatingUsers) });
    }

    const embed = new EmbedBuilder()
      .setTitle(`[${boss.data.qualityName}] **${boss.data.worldBoss.name}** LV.${boss.data.worldBoss.difficulty}`)
      .setDescription(`世界首領出現中 \n **剩餘時間: ${formatTime(leftTime)}**`)
      .setColor(bossQualityColor(boss.data.quality) || 0x000000)
      .setImage(`https://cdn.discordapp.com/emojis/${boss.data.worldBoss.emojiId}.png?v=1`)
      .addFields(...feields)
      .setFooter({ text: `最後擊殺世界首領的玩家會有額外獎勵 \n所有獎勵請到 個人資料 -> 世界首領 -> 領取獎勵 查看` });

    const returnButton = new ButtonBuilder()
      .setCustomId('profile')
      .setLabel('返回')
      .setStyle('Secondary');
    const actionRow = new ActionRowBuilder().addComponents(returnButton);

    await interaction.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
  }
};