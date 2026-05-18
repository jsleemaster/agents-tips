---
title: Agent Skill System Design
aliases:
  - Claude Skills
  - Skill Architecture
tags:
  - skills
  - hooks
  - agent-architecture
---

# Agent Skill System Design

This page compiles the reusable design lessons from the Notion pages `Claude Skills 2.0 - AI 에이전트 스킬 시스템 대규모 업그레이드`, `Claude Code 팁 (2026) - Agent Optimized`, and `Claude Code in Action 과정 + 최신 팁 종합 정리`.

## Core Thesis

Skills are most useful when they are not just long prompts. They should package:

- a triggerable purpose
- a folder-shaped execution surface, not only a single markdown blob
- a narrow operating surface
- optional scripts or references
- connector assumptions, approval boundaries, and audit expectations when the workflow touches governed enterprise data
- clear boundaries about when they do and do not apply
- explicit tradeoffs around tool access, context loading, and determinism

## Good Skill Architecture

- Use strong metadata so the agent can detect when a skill applies.
- Keep the entry document short and route detail to referenced files only when needed.
- Separate workflow skills from capability uplift skills.
- Use isolated execution for risky or noisy tasks when the platform supports it.
- Put deterministic transforms in bundled scripts instead of asking the model to re-derive them every run.
- Prefer file-based skills that can hot-reload during authoring; restart-heavy development loops make trigger tuning and evaluation too expensive.
- Treat the trigger description as product design, not decoration; it determines whether the skill is loaded at all.
- Treat a skill as a package of instructions, scripts, and resources; if the skill cannot survive without chat-only explanation, it is not packaged tightly enough.

## Workflow Skill vs Capability Skill

- Workflow skill:
  - captures a repeated, durable process
  - tends to remain useful even as models improve
  - example: release checklist, code review flow, repo onboarding

- Capability uplift skill:
  - compensates for a model weakness or a niche pattern
  - may become obsolete as base models improve
  - example: a temporary OCR workaround or rigid parsing helper

## Progressive Disclosure Pattern

- Good skills load in stages instead of dumping everything into context at startup.
- Stage 1:
  - metadata only
  - enough to decide whether the skill is relevant
- Stage 2:
  - `SKILL.md`
  - core operating procedure and boundaries
- Stage 3:
  - referenced files, scripts, or examples
  - loaded only for the exact scenario that needs them
- This pattern keeps the trigger surface broad without paying full token cost on every session.

## Metadata And Trigger Design

- The minimum useful metadata is a stable `name` and a description that states when the skill should be used in plain language.
- Trigger phrases should reflect real user requests, not internal jargon.
- For auto-routed helpers such as subagents, wording like "Use proactively after..." is a real trigger lever, not documentation garnish; the invocation path changes materially depending on whether proactive use is encoded in the description.
- If a skill needs strict isolation, special tools, or a distinct execution mode, that should be declared up front rather than hidden in the body.
- Richer frontmatter is valuable only when the runtime actually enforces it; otherwise the design lesson is to keep metadata minimal and reliable.
- Trigger wording should look like operator language such as "Use when user asks..." so the runtime can match real requests instead of taxonomy terms.
- Keep explicit slash-command flows separate from auto-triggered skills; commands are for operator intent, while skills should win only when the runtime can infer the scenario safely.

## Design Principles

- Progressive disclosure is critical: load metadata first, then the main skill, then supporting files only if needed.
- Deterministic work belongs in scripts; descriptive guidance belongs in markdown.
- Hooks should enforce hard invariants, not style preferences.
- Skills should improve future sessions, not bury every insight in chat history.
- Split a skill once the main file becomes large enough that unrelated scenarios would load unnecessary context.
- Keep mutually exclusive paths in separate files so one task does not drag in another task's instructions.
- Once agents become long-running workers, question loops, session status, and elapsed-time visibility are part of the architecture, not optional UI garnish.

## Security And Reliability

- Restrict tool access when a skill does not need the full tool surface.
- Prefer scripts for validation and transformation work.
- Treat unreviewed third-party skills as executable code, not harmless text.
- Audit bundled scripts, dependencies, and frontmatter together; metadata is part of the executable surface because the runtime may inject or route on it.
- If the platform supports forked context or isolated execution, use it for high-risk testing, side-effect-heavy exploration, or noisy intermediate work.
- When the runtime offers multiple isolation modes, treat worktree-isolated execution as the safe default and same-workspace editing as an opt-in fast path.
- Agent-scoped hooks are useful when the invariant belongs to the skill itself rather than the whole repo.
- Use forked or isolated context for skill development and evaluation when a failed experiment would otherwise pollute the main session state.
- In regulated or domain-heavy environments, the reusable unit is often a workflow package rather than a naked skill: connectors, governed data access, approval steps, and audit logs should ship with the task surface instead of being left implicit.
- If enterprise data access is part of the workflow, package connector scope and permission expectations with the skill so the runtime can enforce the right boundary instead of improvising it at call time.
- When a skill acts on behalf of a real user in SaaS or internal systems, prefer delegated OAuth, session binding, scoped tokens, and callback separation over long-lived shared credentials.
- Treat shadow-agent detection and inventory as part of skill architecture, not only security operations: local agents, cloud agents, MCP endpoints, linked identities, and reachable resources should be mappable per workflow.
- Enterprise rollout is increasingly a managed-distribution problem: approved plugins, default hooks, MCP allowlists, and auto-install behavior should be treated as centrally deployed platform policy rather than per-user preference.
- When the execution surface is a managed desktop or VDI rather than a clean API, treat IAM scope, audit trails, screenshot retention, and managed MCP endpoints as part of the governed skill package instead of out-of-band platform setup.
- Managed AI gateways are becoming the enterprise policy plane for agents: MCP exposure, provider routing, capacity controls, guardrails, usage analytics, and audit tables increasingly ship as one surface instead of separate per-tool decisions.
- When a data platform already owns permissions, OAuth, and audit, evaluate whether agent routing and MCP exposure should live in that same gateway rather than in a separate model router plus app-side allowlists.
- In enterprise stacks, treat API mediation and secrets handling as part of the skill architecture itself; the reusable unit is often a governed control plane that spans tool calls, data access, and human approval boundaries.
- AI-assisted remediation should be designed as a governed closed loop rather than a loose coding helper: repo scope, patch generation, fix validation, approval records, and audit-ready evidence should stay in one control path.
- Permission tiers are becoming part of the runtime architecture itself: keep general assistance, trusted defensive analysis, and higher-privilege patch execution behind separate access gates instead of assuming one model profile should do everything.

## What To Capture From New Notion Pages

When a new Notion page is added, extract:

- what repeated workflow it reveals
- whether it is a workflow skill or capability skill
- what the trigger should be
- what should become deterministic code or validation
- what persistent guardrail belongs in project memory
- what should explicitly stay out of the skill because it is too broad, too unstable, or better handled by base instructions

## Design Lessons From The Current Source Set

- Skills and custom commands solve different problems:
  - commands are explicit and operator-invoked
  - skills are opportunistic and auto-triggered
- Hot reload is valuable because it tightens the skill authoring loop; if the platform lacks it, keep the development loop otherwise cheap.
- A reusable skill system starts to look like software engineering once it gains:
  - metadata
  - tool boundaries
  - lifecycle hooks
  - evaluation or A/B testing
  - versioned supporting artifacts
- Skill creator and eval tooling matter once the corpus is large enough that trigger precision, token cost, and success rate need to be measured instead of guessed.
- The wiki should preserve those design levers even when a specific source claim is tied to one vendor runtime.
- Cross-platform skill standards matter when the same skill corpus must work across multiple agent shells; prefer portable folder conventions over runtime-specific prompt hacks when interoperability is part of the goal.
- Vertical agent adoption usually depends more on prepackaged workflow templates plus governed data access than on raw model quality; treat domain connectors and auditability as first-class skill-design inputs.
- For vertical operating layers, keep concrete rollout proof points with the workflow: deployment time, resolution rate, authentication-time reduction, and similar business KPIs are part of the reusable design pattern, not just go-to-market garnish.
- A strong browser-agent pattern is a thin protected core plus an agent-writable helper workspace: let the agent generate reusable helper code and domain skills from real site interactions, but keep the orchestration layer small and reviewable.
- Browser-agent skills should be evaluated against end-to-end session completion across DOM and non-DOM surfaces; selector stability alone is no longer enough once native dialogs, certificate pickers, browser chrome, and other OS-level prompts sit inside the same managed runtime.
- Treat `action -> screenshot -> reaction` as the core runtime primitive for modern computer-use or browser-agent workflows: the useful abstraction is a full session loop with vision feedback, not a one-shot DOM command.
- Browser-agent stacks increasingly need a standard debug surface for WebMCP registration, extension/background-script behavior, browser dialogs, and full accessibility trees; agent readiness is becoming a first-class browser-tooling concern rather than a custom harness add-on.
- When evaluating browser skills or agent-ready sites, look for compatibility audits or equivalent diagnostics for callable surfaces and dialog flows; DOM selector success alone is too narrow once the browser itself exposes agent-aware tooling.
- When standardizing a team skill stack, distribute plugin marketplace choices, always-on hooks, and MCP defaults together so the reusable unit is a governed execution surface rather than a loose prompt bundle.
- Production agent quality should be treated as a reusable system asset: keep trace schema, failure taxonomy, golden eval sets, A/B gates, and rollout criteria with the workflow instead of relying on ad hoc prompt edits after incidents.
- Enterprise agent competition is shifting from assistant UX toward operating-model depth: the durable design question is whether the stack unifies SDLC actions, data access, API gateways, and ops controls under one auditable control plane.
- Enterprise adoption bottlenecks increasingly live in workflow redesign and deployment ownership rather than model access alone; FDE-style rollout capacity, policy integration, and post-launch support are part of the architecture decision, not just vendor services packaging.
- Once rollout moves beyond pilot teams, treat training, certification, Center-of-Excellence ownership, and result-validation responsibility as part of the agent architecture itself; a strong model without a retraining and delivery layer will not scale cleanly through a large organization.
- Treat cross-project agent manifests or global `.agent.md`-style defaults as a managed baseline layer above repo-local instructions; centralize stable policy there and keep repo-specific overrides narrow.

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Notion Source Of Truth]]
