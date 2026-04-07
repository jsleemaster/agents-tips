function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function stringifyError(error) {
  return error instanceof Error ? error.message : String(error);
}

export class TelegramBotClient {
  constructor({
    botToken,
    baseUrl = 'https://api.telegram.org',
    fetchFn = globalThis.fetch,
  } = {}) {
    if (!botToken) {
      throw new Error('botToken is required');
    }

    if (typeof fetchFn !== 'function') {
      throw new Error('fetchFn is required');
    }

    this.botToken = botToken;
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.fetchFn = fetchFn;
  }

  async call(method, payload) {
    const response = await this.fetchFn(`${this.baseUrl}/bot${this.botToken}/${method}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok === false) {
      throw new Error(body.description || `Telegram API ${method} failed with status ${response.status}`);
    }

    return body.result;
  }

  async getUpdates({ offset = 0, timeout = 25 } = {}) {
    return this.call('getUpdates', {
      offset,
      timeout,
      allowed_updates: ['message'],
    });
  }

  async sendMessage(chatId, text) {
    return this.call('sendMessage', {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    });
  }
}

export class TelegramLongPollWorker {
  constructor({
    botClient,
    router,
    allowedChatIds,
    logger = console,
  } = {}) {
    if (!botClient) {
      throw new Error('botClient is required');
    }

    if (!router) {
      throw new Error('router is required');
    }

    this.botClient = botClient;
    this.router = router;
    this.allowedChatIds = allowedChatIds
      ? new Set(allowedChatIds.map((value) => String(value)))
      : null;
    this.logger = logger;
  }

  async processUpdate(update) {
    const message = update?.message;
    if (!message?.text) {
      return;
    }

    const chatId = String(message.chat?.id || '');
    if (this.allowedChatIds && !this.allowedChatIds.has(chatId)) {
      return;
    }

    const reply = await this.router.handleText(message.text);
    if (!reply) {
      return;
    }

    await this.botClient.sendMessage(message.chat.id, reply);
  }

  async pollOnce({ offset = 0, timeout = 25 } = {}) {
    const updates = await this.botClient.getUpdates({ offset, timeout });
    let nextOffset = offset;

    for (const update of updates) {
      nextOffset = Math.max(nextOffset, Number(update.update_id || 0) + 1);
      try {
        await this.processUpdate(update);
      } catch (error) {
        this.logger.error?.(`telegram worker failed to process update ${update.update_id}: ${stringifyError(error)}`);
      }
    }

    return nextOffset;
  }

  async run({ offset = 0, timeout = 25, signal } = {}) {
    let currentOffset = offset;

    while (!signal?.aborted) {
      try {
        currentOffset = await this.pollOnce({
          offset: currentOffset,
          timeout,
        });
      } catch (error) {
        this.logger.error?.(`telegram worker polling error: ${stringifyError(error)}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
}
