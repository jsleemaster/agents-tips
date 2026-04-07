import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deliverErrorEvent,
  formatTelegramAlert,
  normalizeErrorEvent,
} from '../../src/telegram-error-inbox/project-emitter.mjs';

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

test('normalizeErrorEvent validates required fields and supported enums', () => {
  const normalized = normalizeErrorEvent(makeEvent());
  assert.equal(normalized.project, 'design-wiki');
  assert.equal(normalized.severity, 'high');
  assert.deepEqual(normalized.tags, ['sync', 'notion']);

  assert.throws(() => normalizeErrorEvent(makeEvent({ summary: '' })), /summary is required/i);
  assert.throws(() => normalizeErrorEvent(makeEvent({ severity: 'warning' })), /severity/i);
  assert.throws(() => normalizeErrorEvent(makeEvent({ status: 'failed' })), /status/i);
});

test('formatTelegramAlert uses the shared inbox message shape', () => {
  const text = formatTelegramAlert(makeEvent());
  assert.match(text, /^\[design-wiki\]\[prod\]\[high\] Nightly sync failed/i);
  assert.match(text, /source: automation \/ notion-wiki-sync/i);
  assert.match(text, /fingerprint: design-wiki:nightly-sync/i);
  assert.match(text, /runbook: https:\/\/example.com\/runbooks\/notion-sync/i);
});

test('deliverErrorEvent sends Telegram and ledger requests independently', async () => {
  const requests = [];
  const result = await deliverErrorEvent({
    event: makeEvent(),
    telegram: {
      botToken: 'bot-token',
      chatId: '123456',
    },
    ledger: {
      baseUrl: 'http://127.0.0.1:43211',
    },
    fetchFn: async (url, options) => {
      requests.push({
        url,
        options: {
          ...options,
          body: options.body ? JSON.parse(options.body) : null,
        },
      });

      if (url.includes('/sendMessage')) {
        return {
          ok: true,
          status: 200,
          async json() {
            return { ok: true, result: { message_id: 10 } };
          },
        };
      }

      return {
        ok: false,
        status: 503,
        async text() {
          return 'ledger unavailable';
        },
      };
    },
  });

  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /sendMessage/);
  assert.equal(requests[0].options.body.chat_id, '123456');
  assert.match(requests[0].options.body.text, /\[design-wiki\]\[prod\]\[high\]/);
  assert.equal(requests[1].url, 'http://127.0.0.1:43211/events');
  assert.equal(requests[1].options.body.project, 'design-wiki');
  assert.equal(result.telegram.ok, true);
  assert.equal(result.ledger.ok, false);
  assert.match(result.ledger.error, /ledger unavailable/i);
});
