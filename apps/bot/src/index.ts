import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', () => {
  console.log(`🤖 FeedCrafter Discord Bot logged in as ${client.user?.tag}`);
});

const token = process.env.DISCORD_BOT_TOKEN;
if (token) {
  client.login(token).catch(console.error);
} else {
  console.warn('⚠️ DISCORD_BOT_TOKEN variable is missing. Bot client waiting...');
}
