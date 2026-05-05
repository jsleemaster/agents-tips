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
- clear boundaries about when they do and do not apply
- explicit tradeoffs around tool access, context loading, and determinism

## Good Skill Architecture

- Use strong metadata so the agent can detect when a skill applies.
- Keep the entry document short and route detail to referenced files only when needed.
- Separate workflow skills from capability uplift skills.
- Use isolated execution for risky or noisy tasks when the platform supports it.
- Put deterministic transforms in bundled scripts instead of asking the model to re-derive them every run.
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
- If a skill needs strict isolation, special tools, or a distinct execution mode, that should be declared up front rather than hidden in the body.
- Richer frontmatter is valuable only when the runtime actually enforces it; otherwise the design lesson is to keep metadata minimal and reliable.
- Trigger wording should look like operator language such as "Use when user asks..." so the runtime can match real requests instead of taxonomy terms.

## Design Principles

- Progressive disclosure is critical: load metadata first, then the main skill, then supporting files only if needed.
- Deterministic work belongs in scripts; descriptive guidance belongs in markdown.
- Hooks should enforce hard invariants, not style preferences.
- Skills should improve future sessions, not bury every insight in chat history.
- Split a skill once the main file becomes large enough that unrelated scenarios would load unnecessary context.
- Keep mutually exclusive paths in separate files so one task does not drag in another task's instructions.

## Security And Reliability

- Restrict tool access when a skill does not need the full tool surface.
- Prefer scripts for validation and transformation work.
- Treat unreviewed third-party skills as executable code, not harmless text.
- If the platform supports forked context or isolated execution, use it for high-risk testing, side-effect-heavy exploration, or noisy intermediate work.
- Agent-scoped hooks are useful when the invariant belongs to the skill itself rather than the whole repo.
- Use forked or isolated context for skill development and evaluation when a failed experiment would otherwise pollute the main session state.

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
- The wiki should preserve those design levers even when a specific source claim is tied to one vendor runtime.
- Cross-platform skill standards matter when the same skill corpus must work across multiple agent shells; prefer portable folder conventions over runtime-specific prompt hacks when interoperability is part of the goal.

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Notion Source Of Truth]]
