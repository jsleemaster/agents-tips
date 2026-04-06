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
- a narrow operating surface
- optional scripts or references
- clear boundaries about when they do and do not apply

## Good Skill Architecture

- Use strong metadata so the agent can detect when a skill applies.
- Keep the entry document short and route detail to referenced files only when needed.
- Separate workflow skills from capability uplift skills.
- Use isolated execution for risky or noisy tasks when the platform supports it.

## Workflow Skill vs Capability Skill

- Workflow skill:
  - captures a repeated, durable process
  - tends to remain useful even as models improve
  - example: release checklist, code review flow, repo onboarding

- Capability uplift skill:
  - compensates for a model weakness or a niche pattern
  - may become obsolete as base models improve
  - example: a temporary OCR workaround or rigid parsing helper

## Design Principles

- Progressive disclosure is critical: load metadata first, then the main skill, then supporting files only if needed.
- Deterministic work belongs in scripts; descriptive guidance belongs in markdown.
- Hooks should enforce hard invariants, not style preferences.
- Skills should improve future sessions, not bury every insight in chat history.

## Security And Reliability

- Restrict tool access when a skill does not need the full tool surface.
- Prefer scripts for validation and transformation work.
- Treat unreviewed third-party skills as executable code, not harmless text.

## What To Capture From New Notion Pages

When a new Notion page is added, extract:

- what repeated workflow it reveals
- whether it is a workflow skill or capability skill
- what the trigger should be
- what should become deterministic code or validation
- what persistent guardrail belongs in project memory

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Notion Source Of Truth]]
