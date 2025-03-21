const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const axios = require('axios');

require('dotenv').config();

module.exports = {
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('world-boss')
    .setDescription('世界首領'),
  async execute(interaction, optionValue) {
    const discordId = interaction.user.id;
    const typeId = optionValue && optionValue[0];

    await interaction.deferReply();

    const formatNumber = (num) => num.toLocaleString(); // 將數字格式化為千分位顯示

    const hpUI = (currentHp, maxHp) => {
      const barLength = 20; // 血條長度
      const hpRatio = currentHp / maxHp; // 計算血量比例
      const filledBars = Math.floor(hpRatio * barLength); // 滿血條格數
      const emptyBars = barLength - filledBars; // 空血條格數
      const hpBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars); // 血條顯示
      return `[${hpBar}] \n **${formatNumber(currentHp)}** / ${formatNumber(maxHp)}`; // 組合顯示結果
    };

    // 獲取用戶資料
    const user = await axios.get(`${process.env.API_URL}/users/${discordId}`);
    if (!user.data) {
      return interaction.editReply({ content: '用戶不存在，請先使用 `/mine` 創建角色', ephemeral: true });
    }

    const actionRow = new ActionRowBuilder();
    try {
      if (typeId === 'attack') {
        const response = await axios.post(`${process.env.API_URL}/game/worldBoss/attack`, { discordId });
        const { bossAttack, userDamage, userDefense, isLastAttack, userMaxHp, user: newUser, userHpRecoveryTime, currentBoss, userWeapon, isBossDead, newBoss, isAttackPotionActive, isDefensePotionActive } = response.data;

        // 世界首領血量
        const bossHpUI = newBoss ? hpUI(newBoss.remainingHp, newBoss.hp) : hpUI(currentBoss.remainingHp, currentBoss.hp);

        // 玩家藥水狀態
        const { potionInfo, timeMap } = await axios.get(`${process.env.API_URL}/game/potions`).then(res => res.data).catch(() => []);
        const userPotionStatus = []
        if (isAttackPotionActive) {
          userPotionStatus.push(`<:${potionInfo[4].emojiName}:${potionInfo[4].emojiId}> ${potionInfo[4].name}`)
        }
        if (isDefensePotionActive) {
          userPotionStatus.push(`<:${potionInfo[5].emojiName}:${potionInfo[5].emojiId}> ${potionInfo[5].name}`)
        }
        const potionStatus = userPotionStatus.length > 0 ? `\n\n**藥水狀態**:\n${userPotionStatus.join('\n')}` : '';

        // 玩家血量
        const userHpUI = hpUI(parseInt(newUser.hp), userMaxHp);

        // 玩家是否死亡
        const userDeadMsg = newUser.hp <= 0 ? `\n\n你已經死亡，請等待 ${userHpRecoveryTime} 秒後重生` : '';

        // 玩家是否為最後一次攻擊
        const isLastAttackMsg = isLastAttack ? '\n\n**你是最後一次攻擊！將獲得額外一個隨機獎勵！**' : '';

        // 世界首領是否死亡
        const isBossDeadMsg = isBossDead ? '\n\n**世界首領已經死亡！\n請到 個人資料 -> 領取世界首領獎勵 領取獎勵**' : '';

        // 新世界首領資料
        const hasNewBoss = newBoss ? `\n\n**新的世界首領 [${newBoss.qualityName}] ${newBoss.worldBoss.name} LV.${newBoss.worldBoss.difficulty} 出現！**` : '';

        const embed = new EmbedBuilder()
          .setTitle(`${user.data.name} 攻擊 [${currentBoss.qualityName}] ${currentBoss.worldBoss.name} LV.${currentBoss.worldBoss.difficulty}`)
          .setDescription(`你的武器 - ** [${userWeapon.qualityName}] ${userWeapon.weapon.name} +${userWeapon.level} ${potionStatus} ** \n\n造成的傷害: **${userDamage}**\n防禦的傷害: **${userDefense}**\n\n世界首領對你造成的傷害: **${bossAttack}** ${isLastAttackMsg} ${isBossDeadMsg} \n\n你的血量 \n${userHpUI} ${userDeadMsg} ${hasNewBoss} \n\n世界首領血量 \n${bossHpUI}`)
          .setColor(user.data.color || 0x000000)
          .setTimestamp();

        if (!isLastAttack) {
          const attackBossButton = new ButtonBuilder()
            .setCustomId('world-boss_attack')
            .setEmoji('1328357614676873257')
            .setLabel('攻擊世界首領')
            .setStyle('Primary');
          actionRow.addComponents(attackBossButton);
        }
        // 返回世界首領
        const returnBossButton = new ButtonBuilder()
          .setCustomId('world-boss')
          .setEmoji('1325337103164506154')
          .setLabel('返回世界首領')
          .setStyle('Primary');
        actionRow.addComponents(returnBossButton);

        // 武器選單按鈕
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

        await interaction.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
      } else {
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
        feields.push({ name: '血量', value: hpUI(boss.data.remainingHp, boss.data.hp) });
        if (boss.data.participatingUsers.length > 0) {
          // 取前10名
          feields.push({ name: '傷害排行榜', value: getAllUserDamageRankingUI(boss.data.participatingUsers.slice(0, 10)) });
        }

        const embed = new EmbedBuilder()
          .setTitle(`[${boss.data.qualityName}] **${boss.data.worldBoss.name}** LV.${boss.data.worldBoss.difficulty}`)
          .setDescription(`世界首領出現中 \n **剩餘時間: ${formatTime(leftTime)}**`)
          .setColor(bossQualityColor(boss.data.quality) || 0x000000)
          .setImage(`https://cdn.discordapp.com/emojis/${boss.data.worldBoss.emojiId}.png?v=1`)
          .addFields(...feields)
          .setFooter({ text: `最後擊殺世界首領的玩家會有額外獎勵 \n所有獎勵請到 個人資料 -> 世界首領 -> 領取獎勵 查看` });

        const actionRow = new ActionRowBuilder();

        const attackButton = new ButtonBuilder()
          .setCustomId('world-boss_attack')
          .setEmoji('1328357614676873257')
          .setLabel('攻擊世界首領')
          .setStyle('Primary');
        actionRow.addComponents(attackButton);

        const returnButton = new ButtonBuilder()
          .setCustomId('profile')
          .setLabel('返回')
          .setStyle('Secondary');
        actionRow.addComponents(returnButton);

        await interaction.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
      }
    } catch (error) {
      // 返回世界首領
      const returnBossButton = new ButtonBuilder()
        .setCustomId('world-boss')
        .setEmoji('1325337103164506154')
        .setLabel('返回世界首領')
        .setStyle('Primary');
      actionRow.addComponents(returnBossButton);
      const embed = new EmbedBuilder()
        .setTitle('無法攻擊世界首領')
        .setDescription(error?.response?.data?.error || error.message)
        .setColor(0x000000)
        .setTimestamp();
      return interaction.editReply({ embeds: [embed], components: [actionRow], ephemeral: true });
    }
  }
};