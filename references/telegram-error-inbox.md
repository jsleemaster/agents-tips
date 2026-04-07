# Telegram Error Inbox

Use this reference when standardizing failure alerts across multiple personal projects without building a full incident platform.

## Operating model

The recommended pattern is:

- each project emits only action-worthy failure events
- each event is delivered twice:
  - directly to Telegram for immediate alerting
  - to a local ledger service for state, dedupe, and queryability
- Telegram is the inbox
- the local ledger is the memory

This split keeps alerts resilient even if the ledger is temporarily down, while still preserving searchable state on the Mac that you operate from.

## Shared event contract

Canonical event type: `ErrorEvent`

Required fields:

- `event_id`
- `project`
- `environment`
- `fingerprint`
- `severity`: `critical | high | medium | recovery`
- `status`: `open | repeated | recovered`
- `source_type`: `automation | deploy | service | monitor`
- `source_name`
- `summary`
- `occurred_at`

Optional fields:

- `details`
- `links`
- `tags`
- `runbook_url`
- `metadata`

## Incident rules

- Open and repeated events with the same `(project, environment, fingerprint)` are one incident.
- Repeated events increment `repeat_count` instead of opening a new incident.
- Recovery events close the currently open incident for that fingerprint.
- Acknowledgement is separate from recovery. It only means “seen”.

## Telegram policy

Send only events that need attention:

- first failure
- repeated failure after the project-specific threshold
- explicit manual-check-required cases
- recovery after an already opened incident

Do not send:

- noisy warnings
- one-off transient errors that self-healed inside the same run
- routine success notifications

## Message shape

First line:

`[project][environment][severity] summary`

Suggested body:

- `source: <source_type> / <source_name>`
- `occurred_at: <timestamp>`
- `fingerprint: <fingerprint>`
- short details
- runbook or debug link

Recovery messages should reuse the same fingerprint so the operator can visually connect the recovery to the opened problem.

## Local ledger responsibilities

The local hub is intentionally narrow:

- accept `POST /events`
- answer `/status`, `/recent`, `/detail`, and `/ack` via Telegram long polling
- expose a tiny HTTP API for health and incident inspection
- store incidents and raw events in SQLite

It is not a team incident manager, workflow orchestrator, or public SaaS API.

## Failure handling guidance

Project emitters should treat each delivery path independently:

- if Telegram send fails, log the failure and continue
- if ledger send fails, log the failure and continue
- never make the primary automation or deploy flow depend on both destinations succeeding

The alert path should be informative, not a new source of fragility.
