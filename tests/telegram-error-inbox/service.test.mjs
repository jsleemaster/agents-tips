import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { ErrorInboxStore } from '../../src/telegram-error-inbox/store.mjs';
import {
  TelegramCommandRouter,
  TelegramErrorInboxService,
} from '../../src/telegram-error-inbox/service.mjs';
import {
  TelegramBotClient,
  TelegramLongPollWorker,
} from '../../src/telegram-error-inbox/telegram-bot.mjs';

function makeEvent(overrides = {}) {
  return {
    event_id: 'evt_001',
    project: 'design-wiki',
    environment: 'prod',
    fingerprint: 'design-wiki:nightly-sync',
    severity: 'high',
    status: 'open',
    source_type: 'automation',
    source_name: 'notion-wiki-sync',
    summary: 'Nightly sync failed after Notion fetch timeout',
    occurred_at: '2026-04-07T01:15:00.000Z',
    details: 'Notion source fetch timed out after 30 seconds.',
    runbook_url: 'https://example.com/runbooks/notion-sync',
    links: ['https://example.com/jobs/123'],
    tags: ['sync', 'notion'],
    metadata: {
      host: 'sms-macbook-pro',
    },
    ...overrides,
  };
}

async function makeDbPath() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'telegram-error-inbox-'));
  return path.join(dir, 'events.sqlite');
}

async function invokeHttp(service, { method = 'GET', url = '/', headers = {}, body } = {}) {
  const chunks = body == null ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))];
  const request = Readable.from(chunks);
  request.method = method;
  request.url = url;
  request.headers = headers;

  return await new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      headers: {},
      writeHead(statusCode, nextHeaders) {
        this.statusCode = statusCode;
        this.headers = nextHeaders || {};
      },
      end(payload) {
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: payload == null ? '' : String(payload),
        });
      },
    };

    service.handleRequest(request, response).catch(reject);
  });
}

test('ErrorInboxStore aggregates repeated events, closes recoveries, and preserves acknowledgements', async () => {
  const dbPath = await makeDbPath();
  const store = new ErrorInboxStore({ dbPath });

  const first = store.recordEvent(makeEvent());
  assert.equal(first.incident.repeat_count, 1);
  assert.equal(first.incident.status, 'open');

  const second = store.recordEvent(makeEvent({
    event_id: 'evt_002',
    status: 'repeated',
    occurred_at: '2026-04-07T01:30:00.000Z',
  }));
  assert.equal(second.incident.id, first.incident.id);
  assert.equal(second.incident.repeat_count, 2);
  assert.equal(second.incident.last_event_status, 'repeated');

  const recovered = store.recordEvent(makeEvent({
    event_id: 'evt_003',
    severity: 'recovery',
    status: 'recovered',
    summary: 'Nightly sync recovered',
    occurred_at: '2026-04-07T01:45:00.000Z',
  }));
  assert.equal(recovered.incident.id, first.incident.id);
  assert.equal(recovered.incident.status, 'recovered');
  assert.equal(typeof recovered.incident.closed_at, 'string');

  const acked = store.ackIncident(first.incident.id, { acknowledgedBy: 'telegram' });
  assert.equal(acked.id, first.incident.id);
  assert.equal(acked.status, 'recovered');
  assert.equal(acked.acknowledged_by, 'telegram');
  assert.equal(typeof acked.acknowledged_at, 'string');
});

test('TelegramErrorInboxService exposes the HTTP ledger contract', async () => {
  const dbPath = await makeDbPath();
  const service = new TelegramErrorInboxService({ dbPath });

  const health = await invokeHttp(service, { method: 'GET', url: '/health' });
  assert.equal(health.statusCode, 200);
  assert.match(health.headers['content-type'] || '', /application\/json/i);
  assert.equal(JSON.parse(health.body).ok, true);

  const create = await invokeHttp(service, {
    method: 'POST',
    url: '/events',
    headers: { 'content-type': 'application/json' },
    body: makeEvent(),
  });
  assert.equal(create.statusCode, 200);
  const createdPayload = JSON.parse(create.body);
  assert.equal(createdPayload.incident.status, 'open');

  const list = await invokeHttp(service, { method: 'GET', url: '/incidents?status=open' });
  assert.equal(list.statusCode, 200);
  const listedPayload = JSON.parse(list.body);
  assert.equal(listedPayload.incidents.length, 1);

  const detail = await invokeHttp(service, {
    method: 'GET',
    url: `/incidents/${createdPayload.incident.id}`,
  });
  assert.equal(detail.statusCode, 200);
  assert.equal(JSON.parse(detail.body).incident.id, createdPayload.incident.id);

  const ack = await invokeHttp(service, {
    method: 'POST',
    url: `/incidents/${createdPayload.incident.id}/ack`,
    headers: { 'content-type': 'application/json' },
    body: { acknowledgedBy: 'telegram' },
  });
  assert.equal(ack.statusCode, 200);
  assert.equal(JSON.parse(ack.body).incident.acknowledged_by, 'telegram');
});

test('TelegramCommandRouter answers status, detail, and ack commands from SQLite state', async () => {
  const dbPath = await makeDbPath();
  const store = new ErrorInboxStore({ dbPath });
  const created = store.recordEvent(makeEvent());
  store.recordEvent(makeEvent({
    event_id: 'evt_002',
    status: 'repeated',
    occurred_at: '2026-04-07T01:30:00.000Z',
  }));

  const router = new TelegramCommandRouter({ store });

  const statusReply = await router.handleText('/status');
  assert.match(statusReply, /open incidents: 1/i);
  assert.match(statusReply, /design-wiki/i);

  const detailReply = await router.handleText(`/detail ${created.incident.id}`);
  assert.match(detailReply, /Nightly sync failed/i);
  assert.match(detailReply, /repeat count: 2/i);

  const ackReply = await router.handleText(`/ack ${created.incident.id}`);
  assert.match(ackReply, /acknowledged/i);
});

test('TelegramLongPollWorker processes /status and replies through the bot client', async () => {
  const dbPath = await makeDbPath();
  const store = new ErrorInboxStore({ dbPath });
  store.recordEvent(makeEvent());

  const router = new TelegramCommandRouter({ store });
  const requests = [];
  const botClient = new TelegramBotClient({
    botToken: 'bot-token',
    fetchFn: async (url, options) => {
      requests.push({
        url,
        options: {
          ...options,
          body: options.body ? JSON.parse(options.body) : null,
        },
      });

      if (url.includes('/getUpdates')) {
        return {
          ok: true,
          async json() {
            return {
              ok: true,
              result: [
                {
                  update_id: 41,
                  message: {
                    message_id: 1,
                    chat: { id: 777 },
                    text: '/status',
                  },
                },
              ],
            };
          },
        };
      }

      return {
        ok: true,
        async json() {
          return {
            ok: true,
            result: {
              message_id: 2,
            },
          };
        },
      };
    },
  });

  const worker = new TelegramLongPollWorker({
    botClient,
    router,
  });

  const nextOffset = await worker.pollOnce({ offset: 0 });
  assert.equal(nextOffset, 42);
  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /getUpdates/);
  assert.match(requests[1].url, /sendMessage/);
  assert.equal(requests[1].options.body.chat_id, 777);
  assert.match(requests[1].options.body.text, /Open incidents: 1/i);
});
