const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

require('dotenv').config();

client.commands = new Collection();
client.cooldowns = new Collection();

// 讀取commands資料夾下的所有檔案
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  if (message.content === '!ping') {
    await message.reply('Pong!');
  }
});

// 執行指令
async function handleCommand(interaction, commandName, optionValue) {
  const command = client.commands.get(commandName);

  console.log(`Command: ${commandName}`);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  const { cooldowns } = interaction.client;

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const defaultCooldownDuration = 3;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);
      return interaction.reply({ content: `請等待 ${expiredTimestamp - Math.round(now / 1000)} 秒後再次使用 \`${command.data.name}\`。`, ephemeral: true });
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
    await command.execute(interaction, optionValue);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }

  return;
}

client.on('interactionCreate', async interaction => {
  // 開發環境下，只回應指定伺服器的指令
  if (process.env.NODE_ENV === 'development' && process.env.DISCORD_GUILD_ID && interaction.guildId !== process.env.DISCORD_GUILD_ID) {
    console.log(`User: ${interaction.user.globalName} (${interaction.user.id}) tried to use command in a different guild.`);
    return interaction.reply({ content: '虛寶探險維護中，請稍後再試。', ephemeral: true });
  }
  if (interaction.isCommand()) {
      // 處理指令
      await handleCommand(interaction, interaction.commandName);
  } else if (interaction.isButton()) {
      // 處理按鈕
      const [command, ...optionValue] = interaction.customId.split('_');
      await handleCommand(interaction, command, optionValue);
  } else if(interaction.isStringSelectMenu()) {
     // 處理選擇菜單
     const selectedOption = interaction.values[0]; // 取得選擇的值
      const [command, ...optionValue] = selectedOption.split('_');
      await handleCommand(interaction, command, optionValue);
  }
});

client.on('error', console.error);

client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);