# Telegram Error Inbox Onboarding

Use this document when you want another agent to wire an existing project into the shared Telegram error inbox with minimal back-and-forth.

## Shared infrastructure

Assume the shared inbox is already running on the same Mac.

- shared infra repo: `/Users/smlee/agent-tips`
- contract reference: `/Users/smlee/agent-tips/references/telegram-error-inbox.md`
- deployment reference: `/Users/smlee/agent-tips/references/telegram-error-inbox-deployment.md`
- reusable integration skill: `/Users/smlee/agent-tips/skills/public/project-alert-integration/SKILL.md`
- local launcher: `/Users/smlee/agent-tips/scripts/start-telegram-error-inbox-local.sh`
- local health endpoint: `http://127.0.0.1:43311/health`
- local ledger base URL: `http://127.0.0.1:43311`
- local secrets file: `/Users/smlee/agent-tips/.telegram-error-inbox.local.env`

Secret handling rules:

- never print the bot token in the response
- never commit secrets into the target repo
- read the local env file only when required for a smoke check or a local run

## Copy-paste kickoff prompt

Use the prompt below as the default handoff to another coding agent.

```md
Integrate this repository with my shared Telegram Error Inbox that is already running on my Mac.

Shared infra you should use:

- repo: `/Users/smlee/agent-tips`
- contract doc: `/Users/smlee/agent-tips/references/telegram-error-inbox.md`
- deployment doc: `/Users/smlee/agent-tips/references/telegram-error-inbox-deployment.md`
- reusable skill: `/Users/smlee/agent-tips/skills/public/project-alert-integration/SKILL.md`
- local ledger base URL: `http://127.0.0.1:43311`
- local health check: `curl -s http://127.0.0.1:43311/health`
- local secrets file: `/Users/smlee/agent-tips/.telegram-error-inbox.local.env`

Important constraints:

- Do not print or commit secrets.
- Reuse the shared `ErrorEvent` contract.
- Deliver the same actionable event to both destinations:
  - Telegram Bot API
  - local ledger `POST /events`
- Treat those two delivery paths independently. Failure to alert must not block the primary workflow.
- Prefer one explicit harness/helper seam instead of scattered raw Telegram calls.
- Only alert on actionable failures, repeated failures past a threshold, manual-check-required states, and recoveries.
- Skip low-signal warnings and instantly self-healed retries.

Your task:

1. Inspect this repository and identify the real actionable failure boundary.
2. Propose the narrowest alert seam that fits the repo:
   - automation script
   - deploy pipeline
   - service monitor
   - background worker
3. Implement a small reusable harness/helper in this repo that maps local failures into the shared `ErrorEvent` contract.
4. Add or update local documentation so a future maintainer can understand:
   - what triggers alerts
   - which environment variables are needed
   - how to run a smoke test
5. Run a real smoke test against the shared inbox:
   - verify Telegram delivery
   - verify ledger persistence at `http://127.0.0.1:43311`
   - verify the incident is queryable
6. Commit and push the integration changes in a PR-sized unit.

Implementation guidance:

- If this repo is Node-based, it is fine to mirror the shared pattern in a local helper rather than creating a brittle cross-repo dependency.
- If this repo is not Node-based, implement an equivalent small emitter in the native stack while preserving the same event schema and dual-delivery behavior.
- If you need local secrets for smoke tests, read `/Users/smlee/agent-tips/.telegram-error-inbox.local.env` without echoing the values back.
- If the shared inbox looks down, inspect or start it from `/Users/smlee/agent-tips` before concluding the integration is blocked.

Done means:

- the repo has one clear alert harness seam
- actionable failures are mapped to the shared `ErrorEvent`
- env/documentation are updated
- one smoke alert successfully reaches both Telegram and the local ledger
- verification commands were run and summarized
```

## What a good integration should leave behind

Minimum artifacts in the target repo:

- one alert harness/helper module or script
- a narrow configuration surface for env vars
- a short maintainer note describing alert thresholds and fingerprint strategy
- at least one smoke-check command

Good implementation traits:

- explicit fingerprints instead of free-form dedupe logic
- a stable `project` and `environment` naming scheme
- a short `summary` line that is readable in Telegram
- optional details only when they change operator action

## Suggested review checklist

Use this when reviewing what another agent changed:

- Does the repo alert only on action-worthy failures?
- Is there exactly one obvious seam for emitting alerts?
- Are Telegram and ledger sends independent?
- Are secrets kept local and out of git?
- Can the maintainer rerun the smoke test without reading source code?
- Is at least one incident visible through the local ledger after the smoke test?

## Troubleshooting

- If `http://127.0.0.1:43311/health` fails, the shared inbox is not running or the port changed.
- If Telegram works but the ledger fails, verify the integration is sending `ledger.baseUrl`, not a full `/events` URL in the wrong field.
- If the ledger works but Telegram fails, verify the bot token is valid and the target chat has already started the bot.
- If `/status` looks empty after a smoke event, inspect the incident through the HTTP API first to separate polling issues from storage issues.
