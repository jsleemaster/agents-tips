---
name: project-alert-integration
description: "Integrate a project with the shared Telegram error inbox contract. Use when adding failure alerts, dual delivery, or a small alert harness to an automation, deploy flow, service, or monitor."
---

# Project Alert Integration

Use this skill when a project needs to emit reusable error events into the shared Telegram inbox pattern.

Reference docs:

- [telegram-error-inbox](../../../references/telegram-error-inbox.md)
- [telegram-error-inbox-deployment](../../../references/telegram-error-inbox-deployment.md)
- [telegram-error-inbox-onboarding](../../../references/telegram-error-inbox-onboarding.md)
- [agent-harness-patterns](../../../references/agent-harness-patterns.md)

## 1) Find the real failure boundary

Before adding alerts, identify:

- what actually counts as an actionable failure
- where the project already knows enough context to produce a meaningful event
- what should be grouped under one fingerprint versus split apart

Do not alert on every exception just because it exists.

## 2) Emit the standard event contract

Every project should map its failures into the shared `ErrorEvent` fields:

- `event_id`
- `project`
- `environment`
- `fingerprint`
- `severity`
- `status`
- `source_type`
- `source_name`
- `summary`
- `occurred_at`

Add optional `details`, `links`, `tags`, `runbook_url`, and `metadata` only when they materially help the operator.

## 3) Keep delivery dual and independent

Deliver the same event to both destinations:

- Telegram Bot API for immediate alerting
- local ledger `POST /events` for history and queryability

Each path should fail independently:

- Telegram failure should be logged, not block the primary workflow
- ledger failure should be logged, not block the primary workflow

## 4) Use a narrow harness

Prefer one explicit alert seam:

- one helper module
- one script
- one command

Avoid scattering Telegram formatting and HTTP posting across unrelated files.

## 5) Default alert policy

Send:

- first failure
- repeated failures once they cross the project threshold
- manual-check-required states
- recovery after an opened incident

Skip:

- low-signal warnings
- instantly self-healed retries
- routine success messages

## 6) Minimum smoke check

Before calling the integration done:

- emit one test event
- confirm Telegram delivery
- confirm ledger persistence
- confirm `/status` or `/detail <id>` reflects the event

If any one of those fails, the integration is incomplete.

## 7) Fast handoff option

If you are onboarding another agent into an existing repo, start from:

- [telegram-error-inbox-onboarding](../../../references/telegram-error-inbox-onboarding.md)

That reference includes a copy-paste kickoff prompt, shared infra assumptions, and a review checklist for the finished integration.
