---
title: Claude Code Operating Patterns
aliases:
  - Claude Code Tips
  - Claude Code Workflow Guide
tags:
  - claude-code
  - workflow
  - agents
---

# Claude Code Operating Patterns

This page is the compiled operating guide from the Notion pages `Claude Code 팁 (2026) - Agent Optimized` and `Claude Code in Action 과정 + 최신 팁 종합 정리`.

## Highest-Leverage Defaults

- Keep persistent guidance in `CLAUDE.md`, not only in chat, because it reloads after compaction.
- Keep `CLAUDE.md` lean; only store rules that materially reduce repeated mistakes.
- Use `/compact` before the context window becomes crowded; waiting for forced compaction hurts answer quality.
- Reset or fork sessions at work boundaries instead of dragging one giant context through every task.

## Working Model

- Claude Code is strongest when it works as a terminal agent, not as a passive explainer.
- The best workflow is usually:
  - establish durable project rules
  - let the agent act on a bounded task
  - verify with tests or hooks
  - write back the new lesson into durable memory

## Command-Level Habits

- `/init` to generate the initial project memory surface.
- `/compact` to preserve a useful summary while dropping excess context.
- `/clear` or `/reset` when a task boundary is complete.
- `/mcp` for external systems, but only when the tool meaning is crisp.
- `/plan` when the work has multiple moving parts or non-obvious tradeoffs.

## Context Management

- Context is a degrading asset, not a free buffer.
- Point to files directly with `@path` instead of re-explaining where things are.
- Use small handoff artifacts when changing sessions.
- If a task has become muddy, a new session with a cleaner brief usually beats continuing in place.

## Parallelism

- Use subagents or separate sessions for clearly separable work.
- Use peer-style teams only when the coordination value outweighs the token cost.
- Small, isolated tasks are better than vague parallel requests.

## Hooks And Guardrails

- Hooks are valuable when a step must always happen, not when it is merely preferred.
- Quality gates are strongest at commit or stop boundaries, not on every tiny edit.
- Deterministic automation should live in hooks or scripts, not in hope that the model remembers.

## MCP Guidance

- A few strong MCP entrypoints beat a huge catalog of thin wrappers.
- Tool names and `serverInstructions` should be explicit enough that the agent can choose them without loading the whole schema.
- Stateful browser-style tools are especially good MCP candidates.

## Related Pages

- [[Agent Skill System Design]]
- [[Open Model Runtime Selection]]
- [[Notion Source Of Truth]]
