const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ]
  });

require('dotenv').config();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  if (message.content === '!ping') {
    await message.reply('Pong!');
  }
});

client.on('error', console.error);

client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);