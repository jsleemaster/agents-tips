# Telegram Error Inbox Deployment

Use this guide to run the local Telegram error inbox as a lightweight personal operations service on macOS.

## Components

- Node service: `src/telegram-error-inbox/cli.mjs`
- SQLite ledger file
- Telegram long polling worker in the same process
- macOS `LaunchAgent` for keep-alive startup

## Runtime assumption

- Current implementation uses the built-in `node:sqlite` module.
- Treat Node `25.x` or newer as the default runtime for this package.
- If a project cannot use that runtime yet, replace the storage layer with a stable SQLite binding before rolling it out broadly.

## Environment variables

- `TELEGRAM_ERROR_INBOX_HOST`
  - default: `127.0.0.1`
- `TELEGRAM_ERROR_INBOX_PORT`
  - default: `43211`
- `TELEGRAM_ERROR_INBOX_DB_PATH`
  - default: `~/Library/Application Support/agent-tips/telegram-error-inbox.sqlite`
- `TELEGRAM_BOT_TOKEN`
  - required to enable Telegram polling
- `TELEGRAM_ALLOWED_CHAT_IDS`
  - comma-separated allowlist for command handling
- `TELEGRAM_POLL_TIMEOUT_SEC`
  - default: `25`

## Manual run

```bash
export TELEGRAM_BOT_TOKEN="123456:telegram-bot-token"
export TELEGRAM_ALLOWED_CHAT_IDS="123456789"
npm run start:telegram-error-inbox
```

Without `TELEGRAM_BOT_TOKEN`, the HTTP ledger still runs, but Telegram command polling stays disabled.

If you prefer a local non-committed env file, create `.telegram-error-inbox.local.env` in the repo root and use:

```bash
./scripts/start-telegram-error-inbox-local.sh
```

## LaunchAgent pattern

Use a user-level LaunchAgent so the service starts at login and restarts on failure.

Reference template:

- [com.agenttips.telegram-error-inbox.plist.example](../assets/telegram-error-inbox/com.agenttips.telegram-error-inbox.plist.example)

Typical workflow:

1. Copy the template to `~/Library/LaunchAgents/`
2. Replace paths and environment placeholders
3. Load it with `launchctl bootstrap gui/$UID ...`
4. Confirm the HTTP health endpoint and Telegram `/status`

## Health and smoke checks

HTTP:

```bash
curl -s http://127.0.0.1:43211/health
```

Ledger event smoke:

```bash
curl -s -X POST http://127.0.0.1:43211/events \
  -H 'content-type: application/json' \
  -d '{
    "event_id": "smoke-001",
    "project": "smoke",
    "environment": "prod",
    "fingerprint": "smoke:test",
    "severity": "high",
    "status": "open",
    "source_type": "monitor",
    "source_name": "manual-smoke",
    "summary": "Smoke event",
    "occurred_at": "2026-04-07T00:00:00.000Z"
  }'
```

Telegram:

- `/status`
- `/recent`
- `/detail <id>`
- `/ack <id>`

## Backup and retention

- SQLite is a single local file, so periodic file-level backup is enough for v1.
- If the ledger grows too large, archive or prune raw events before changing the incident table.
- Keep Telegram chat history as an operator-facing timeline, not the canonical database.

## Multi-project rollout

Each project should receive the same minimum configuration surface:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_ERROR_LEDGER_URL`
- project name
- environment name

Projects should package alert emission behind a tiny harness or helper, not scatter raw Telegram calls across scripts.
