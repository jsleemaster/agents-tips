import { normalizeErrorEvent } from './schema.mjs';

export { normalizeErrorEvent } from './schema.mjs';

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function stringifyTransportError(error) {
  return error instanceof Error ? error.message : String(error);
}

export function formatTelegramAlert(eventInput) {
  const event = normalizeErrorEvent(eventInput);
  const lines = [
    `[${event.project}][${event.environment}][${event.severity}] ${event.summary}`,
    `source: ${event.source_type} / ${event.source_name}`,
    `occurred_at: ${event.occurred_at}`,
    `fingerprint: ${event.fingerprint}`,
  ];

  if (event.details) {
    lines.push(`details: ${event.details}`);
  }

  if (event.runbook_url) {
    lines.push(`runbook: ${event.runbook_url}`);
  }

  if (event.links.length > 0) {
    lines.push(`links: ${event.links.join(', ')}`);
  }

  return lines.join('\n');
}

async function sendTelegramAlert({ event, telegram, fetchFn }) {
  if (!telegram?.botToken || !telegram?.chatId) {
    return {
      attempted: false,
      ok: false,
      error: 'telegram destination is not configured',
    };
  }

  const apiBaseUrl = normalizeBaseUrl(telegram.apiBaseUrl || 'https://api.telegram.org');
  const url = `${apiBaseUrl}/bot${telegram.botToken}/sendMessage`;

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegram.chatId,
        text: formatTelegramAlert(event),
        disable_web_page_preview: true,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      return {
        attempted: true,
        ok: false,
        error: payload.description || `telegram request failed with status ${response.status}`,
      };
    }

    return {
      attempted: true,
      ok: true,
      message_id: payload.result?.message_id,
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      error: stringifyTransportError(error),
    };
  }
}

async function sendLedgerEvent({ event, ledger, fetchFn }) {
  if (!ledger?.baseUrl) {
    return {
      attempted: false,
      ok: false,
      error: 'ledger destination is not configured',
    };
  }

  const url = `${normalizeBaseUrl(ledger.baseUrl)}/events`;

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      return {
        attempted: true,
        ok: false,
        error: details || `ledger request failed with status ${response.status}`,
      };
    }

    const payload = await response.json().catch(() => ({}));
    return {
      attempted: true,
      ok: true,
      incident_id: payload.incident?.id,
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      error: stringifyTransportError(error),
    };
  }
}

export async function deliverErrorEvent({
  event: eventInput,
  telegram,
  ledger,
  fetchFn = globalThis.fetch,
} = {}) {
  const event = normalizeErrorEvent(eventInput);

  if (typeof fetchFn !== 'function') {
    throw new Error('fetchFn is required');
  }

  const [telegramResult, ledgerResult] = await Promise.all([
    sendTelegramAlert({ event, telegram, fetchFn }),
    sendLedgerEvent({ event, ledger, fetchFn }),
  ]);

  return {
    event,
    telegram: telegramResult,
    ledger: ledgerResult,
  };
}
