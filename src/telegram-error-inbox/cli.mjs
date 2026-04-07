import os from 'node:os';
import path from 'node:path';

import { TelegramErrorInboxService, TelegramCommandRouter } from './service.mjs';
import { TelegramBotClient, TelegramLongPollWorker } from './telegram-bot.mjs';

const host = process.env.TELEGRAM_ERROR_INBOX_HOST || '127.0.0.1';
const port = Number(process.env.TELEGRAM_ERROR_INBOX_PORT || 43211);
const dbPath = process.env.TELEGRAM_ERROR_INBOX_DB_PATH
  ? path.resolve(process.env.TELEGRAM_ERROR_INBOX_DB_PATH)
  : path.join(os.homedir(), 'Library', 'Application Support', 'agent-tips', 'telegram-error-inbox.sqlite');
const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const allowedChatIds = (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const pollTimeout = Number(process.env.TELEGRAM_POLL_TIMEOUT_SEC || 25);

const service = new TelegramErrorInboxService({ dbPath });
const { url } = await service.listen({ host, port });
process.stdout.write(`Telegram error inbox listening at ${url} using ${dbPath}\n`);

if (!botToken) {
  process.stdout.write('Telegram long polling is disabled because TELEGRAM_BOT_TOKEN is not set.\n');
} else {
  const router = new TelegramCommandRouter({ store: service.store });
  const botClient = new TelegramBotClient({ botToken });
  const worker = new TelegramLongPollWorker({
    botClient,
    router,
    allowedChatIds,
  });

  process.stdout.write(`Telegram long polling enabled${allowedChatIds.length > 0 ? ` for chats: ${allowedChatIds.join(', ')}` : ''}\n`);
  await worker.run({ timeout: pollTimeout });
}
