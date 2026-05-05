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
- Keep `CLAUDE.md` lean; target roughly 2,500 tokens or less and only keep rules where removing them would likely cause a repeat mistake.
- Add rules incrementally when the agent actually fails, instead of writing a giant handbook up front.
- Use `**Important**` sparingly for rules that truly must survive model drift.
- Use the `#` shortcut to append durable guidance as soon as a new rule is discovered.
- Use `/compact` before the context window becomes crowded; waiting for forced compaction hurts answer quality.
- Manually compact around the 70 to 80 percent range, after roughly 30 minutes of active work, or when the tool warns that context is getting large.
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
- `/context` to inspect token pressure instead of guessing.
- `/cost` when a workflow is drifting into expensive territory.
- `/fork` or `/resume` when the value is preserving a branch of thinking, not one continuously growing session.
- Prefer `Shift+Tab` or `/plan` before execution when the task needs architecture review, test shape agreement, or risk checks; do not pay plan-mode overhead for straightforward local edits.

## Context Management

- Context is a degrading asset, not a free buffer.
- Point to files directly with `@path` instead of re-explaining where things are.
- Use small handoff artifacts when changing sessions.
- Before clearing a long session, write a short `HANDOFF.md`-style note with attempted approaches, known failures, and the next decision to unblock.
- If a task has become muddy, a new session with a cleaner brief usually beats continuing in place.
- Pipe large logs or outputs directly into the agent instead of paraphrasing them by hand.
- Image paste and direct file references are usually cheaper than verbose re-description.

## Parallelism

- Use subagents or separate sessions for clearly separable work.
- Use peer-style teams only when the coordination value outweighs the token cost.
- Small, isolated tasks are better than vague parallel requests.
- Prefer isolated git worktrees for concurrent feature lanes so each session keeps its own repo state, branch intent, and rollback surface.

## Agent Teams Vs Subagents

- Use subagents when the work stays inside one main session and the parent should remain the control plane.
- Use Agent Teams only when peers need independent context, direct messaging, or long-running coordination patterns.
- Team topology should be chosen deliberately:
  - hub-and-spoke for central orchestration
  - task queue when workers can self-assign
  - pipeline for ordered handoff
  - competitive when multiple candidate solutions are worth comparing
  - worker plus watchdog when one agent should verify another
- Agent Teams are expensive relative to a normal session, with source notes estimating roughly 5 to 7 times the token cost.
- Prefer smaller models for workers, close completed workers quickly, and keep tasks self-contained if using team mode.
- Avoid Agent Teams when the same file needs concurrent edits, when you need nested teams, or when session resume matters.

## Hooks And Guardrails

- Hooks are valuable when a step must always happen, not when it is merely preferred.
- Quality gates are strongest at commit or stop boundaries, not on every tiny edit.
- Deterministic automation should live in hooks or scripts, not in hope that the model remembers.
- The high-value lifecycle points are:
  - `PreToolUse` for blocking dangerous inputs
  - `PostToolUse` for formatting or local validation
  - `Stop` for end-of-turn checks and self-correction loops
  - `SessionStart` for loading session context
  - `SubagentStop` for verifying delegated work before merge
- Prefer blocking at `git commit` or other durable boundaries rather than on every write.
- A stop-hook feedback loop that checks errors and forces a repair pass is one of the strongest quality multipliers in the source material.

## MCP Guidance

- A few strong MCP entrypoints beat a huge catalog of thin wrappers.
- Tool names and `serverInstructions` should be explicit enough that the agent can choose them without loading the whole schema.
- Stateful browser-style tools are especially good MCP candidates.
- Tool search should be on when MCP definitions are large; source notes claim it can cut schema token load by roughly 85 to 96 percent.
- `serverInstructions` should describe the real task surface in operator language, not generic transport details.
- Prefer MCP for stateful environments like Playwright and prefer CLI for stateless systems where shell commands are already strong.

## CLI And Automation Defaults

- Prefer fast CLI replacements in agent-facing repos:
  - `fd` over `find`
  - `rg` over `grep`
  - `bat` over `cat`
  - `eza` over `ls`
- Non-interactive flags belong in durable project guidance when the agent must avoid blocking:
  - `--json`
  - `--yes`
  - `--quiet`
  - `--format json`
- For automation chains, use explicit output formats, turn limits, budget limits, and allowed-tool lists rather than trusting ambient defaults.
- Verification should be part of the workflow, not a final optional question:
  - explain how the change will be checked
  - run the test or validation loop
  - only then write durable memory
- For larger changes, keep writer and reviewer passes in separate sessions or subagents so the review context is not contaminated by the implementation path.
- When resetting after a long task, prefer a handoff note that records attempted paths, validation status, and the single next unblocker rather than a prose recap of everything learned.

## Related Pages

- [[Agent Skill System Design]]
- [[Open Model Runtime Selection]]
- [[Notion Source Of Truth]]
