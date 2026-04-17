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
- `/model` when the task shape changes enough that a cheaper or stronger model is warranted.
- `/mcp` for external systems, but only when the tool meaning is crisp.
- `/plan` when the work has multiple moving parts or non-obvious tradeoffs.
- `/context` to inspect token pressure instead of guessing.
- `/doctor` to see per-server MCP token load and verify whether tool search is actually paying off.
- `/cost` when a workflow is drifting into expensive territory.
- `/diff` when you need to inspect the current edit surface without leaving the session.
- `/fork` or `/resume` when the value is preserving a branch of thinking, not one continuously growing session.
- `/rewind` when the fastest recovery path is restoring an earlier state instead of talking through rollback.
- `/security-review` when the risk surface needs a dedicated pass rather than a generic code review.
- `/install-github-app` once per account or repo setup when GitHub review state should become part of normal agent workflow.
- `/pr-comments`, `/plugin`, and `/skills` when the task is about external review state, installed capabilities, or available reusable skill surfaces.
- `/teleport` when a cloud session should continue locally instead of being restarted from scratch.
- `/btw` for side questions that should not pollute the main thread and `/output-style` only when explanation depth, not task execution, is the variable to tune.

## Context Management

- Context is a degrading asset, not a free buffer.
- Treat the system prompt as assembled state, not just the latest chat turn. Current date, git status, working tree state, `CLAUDE.md`, and loaded tool surfaces all shape behavior before the model sees the task.
- Point to files directly with `@path` instead of re-explaining where things are.
- Use small handoff artifacts when changing sessions.
- Before clearing a long session, write a short `HANDOFF.md`-style note with attempted approaches, known failures, and the next decision to unblock.
- If a task has become muddy, a new session with a cleaner brief usually beats continuing in place.
- Pipe large logs or outputs directly into the agent instead of paraphrasing them by hand.
- Image paste and direct file references are usually cheaper than verbose re-description.
- Use `CLAUDE.md` for stable routing rules and behavioral constraints because it is part of context assembly; ephemeral chat instructions are weaker than rules that re-enter every turn.

## Execution Modes

- Plan mode is the right boundary when you want a read-only proposal loop before granting execution.
- `Shift+Tab` or `Alt+M` cycles approval behavior, so the operator can move between Normal, Auto-accept, and Plan mode without leaving the main loop.
- Approval mode is operational policy, not just UI state:
  - Normal when every side effect should still be operator-gated
  - Auto-accept when the workflow is verified enough to trade oversight for speed
  - Plan when read-only analysis should stay separated from execution
- Treat any higher-autonomy mode as a governance choice, not a convenience toggle:
  - define which tasks may bypass approvals
  - pair autonomy with stronger logs, retries, and rollback expectations
  - decide whether reasoning effort should be raised or lowered for that mode instead of leaving cost and latency implicit
- Extended thinking is usually worth the token premium on complex tasks because the total retry cost often drops even when per-turn cost rises.

## Parallelism

- Use subagents or separate sessions for clearly separable work.
- Use peer-style teams only when the coordination value outweighs the token cost.
- Small, isolated tasks are better than vague parallel requests.
- Context rot is a structural problem, not just a prompt problem; split long workflows before one giant session accumulates too much exploration debris.
- Give each delegated agent a narrow role, explicit tool scope, and a bounded write surface.
- Parallel reads, search, and test discovery are usually safer than parallel edits.
- When multiple agents may edit code, assign file ownership up front or keep one writer and the rest read-only.

## Agent Teams Vs Subagents

- Agent Teams were introduced as a research-preview surface in Claude Code `v2.1.32+` with Opus `4.6+`, gated behind `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- Use subagents when the work stays inside one main session and the parent should remain the control plane.
- Use Agent Teams only when peers need independent context, direct messaging, or long-running coordination patterns.
- Team leader sessions should stay orchestration-focused; the source notes call out a dedicated delegate mode rather than having the leader code and coordinate at once.
- Team topology should be chosen deliberately:
  - hub-and-spoke for central orchestration
  - task queue when workers can self-assign
  - pipeline for ordered handoff
  - competitive when multiple candidate solutions are worth comparing
  - worker plus watchdog when one agent should verify another
- Agent Teams are expensive relative to a normal session, with source notes estimating roughly 5 to 7 times the token cost.
- Prefer smaller models for workers, close completed workers quickly, and keep tasks self-contained if using team mode.
- Avoid Agent Teams when the same file needs concurrent edits, when you need nested teams, or when session resume matters.
- Store reusable specialist definitions with the repo when the team needs shared defaults; user-level definitions are better for personal operating habits that should not leak into project policy.
- Explicit specialist files beat hidden prompt tricks when the operator needs to see which role, tools, and instructions a delegated agent is actually using.

## Hooks And Guardrails

- Hooks are valuable when a step must always happen, not when it is merely preferred.
- Quality gates are strongest at commit or stop boundaries, not on every tiny edit.
- Deterministic automation should live in hooks or scripts, not in hope that the model remembers.
- Hooks are a stronger control layer than `CLAUDE.md` alone: project memory is guidance, while hooks can block or reshape execution deterministically.
- Treat approval mode as part of the execution model, not as cosmetic UI. A session that can bypass approvals, retry failures, or run in a more autonomous mode needs different logging and review boundaries than a default approval-gated session.
- Hook handler choice should match the job:
  - command handlers for cheap deterministic checks
  - prompt handlers for one-turn model evaluation when the rule is fuzzy
  - agent handlers when validation needs tool access or deeper inspection
- The high-value lifecycle points are:
  - `PreToolUse` for blocking dangerous inputs, typically by returning a non-zero failure and using hard block semantics such as exit code `2` when the platform supports it
  - `PostToolUse` for formatting or local validation
  - `UserPromptSubmit` for prompt validation or context injection before work starts
  - `Stop` for end-of-turn checks and self-correction loops
  - `SessionStart` for loading session context
  - `Notification` for custom alerts or out-of-band reporting
  - `SubagentStop` for verifying delegated work before merge
- The practical rollout order is:
  - start with `PostToolUse` auto-formatting
  - add `PreToolUse` blocks for destructive commands
  - add `Stop` notifications or validation summaries
  - only then expand into more specialized hook logic
- Prefer blocking at `git commit` or other durable boundaries rather than on every write.
- A stop-hook feedback loop that checks errors and forces a repair pass is one of the strongest quality multipliers in the source material.
- Hook config location is part of the governance model:
  - `~/.claude/settings.json` for personal global policy
  - `.claude/settings.json` for shared repo policy
  - `.claude/settings.local.json` for local-only exceptions

## MCP Guidance

- A few strong MCP entrypoints beat a huge catalog of thin wrappers.
- Tool names and `serverInstructions` should be explicit enough that the agent can choose them without loading the whole schema.
- Stateful browser-style tools are especially good MCP candidates.
- Tool search should be on when MCP definitions are large; source notes claim it can cut schema token load by roughly 85 to 96 percent.
- The default activation point is when MCP definitions exceed roughly 10 percent of context, and an aggressive mode can lower that threshold to 5 percent.
- `serverInstructions` should describe the real task surface in operator language, not generic transport details.
- Prefer MCP for stateful environments like Playwright and prefer CLI for stateless systems where shell commands are already strong.
- Scope placement is part of the routing decision:
  - `-s local` for personal local-only MCP config in `.claude/settings.local.json`
  - `-s project` for team-shared MCP config in `.mcp.json`
  - `-s user` for personal defaults across projects in `~/.claude/settings.json`
- Use environment switches deliberately:
  - `ENABLE_TOOL_SEARCH=auto` for the default threshold-based behavior
  - `ENABLE_TOOL_SEARCH=auto:5` when large MCP catalogs should load even more aggressively
  - `ENABLE_TOOL_SEARCH=false` only when debugging or benchmarking the raw schema load

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
- Keep the session entrypoint aligned with the actual control need:
  - `claude -p` for single-shot non-interactive runs
  - `claude -c` for continuing the most recent session
  - `claude -r <id>` when exact session continuity matters
  - `claude -w <name>` when the task needs isolated git state, not just a fresh conversation
- The useful non-interactive knobs to preserve in project guidance are:
  - `--output-format json|stream-json|text`
  - `--max-turns <n>`
  - `--max-budget-usd <n>`
  - `--json-schema <schema>`
  - `--allowedTools ...`
  - `--append-system-prompt ...`
- Verification should be part of the workflow, not a final optional question:
  - explain how the change will be checked
  - run the test or validation loop
  - only then write durable memory
- For browser-facing work, evaluate the agent loop by end-to-end task completion:
  - can it run or inspect the browser state
  - can it feed visual evidence back into the session
  - can it retry after failures under the current approval policy
  - can the operator inspect what happened afterward
- Session chaining is a first-class automation pattern:
  - capture the emitted session ID
  - resume that session for follow-up prompts instead of starting fresh when continuity matters
- One-time GitHub setup is a real operator shortcut: install the GitHub app once, then pull request review and comment retrieval can be treated as normal session workflows rather than ad hoc manual setup.
- When evaluating an agent platform, treat the local inner loop as a first-class product surface:
  - local run and remote invoke should use the same operator entrypoint when possible
  - session continuity should survive repeat debug cycles instead of forcing fresh stateless tests
  - portal or console round-trips are a real productivity tax, not a harmless implementation detail
- For complex repos, evaluate execution-context fidelity before benchmark deltas:
  - can the agent reuse the existing IDE semantic index instead of re-deriving structure from text search alone
  - can it reuse the project's actual build and test configuration instead of guessing shell commands
  - can it perform symbol-aware refactors with scope and overload awareness instead of file-level string edits

## Multi-Session Patterns

- Use a git worktree when parallel tasks need isolated filesystem state, not only isolated reasoning.
- A writer/reviewer split is a strong default for major changes because the reviewer session gets a cleaner context and less confirmation bias.
- Treat long-running cloud coding agents as remote workers, not PR generators. The durable operating artifacts are the branch, diff, session log, approval points, and PR creation policy.
- If a remote agent can be started from an issue, prompt, or mobile surface before a PR exists, keep PR creation as an explicit checkpoint unless the task brief asks the agent to open one automatically.
- Handoff artifacts should stay small and executable:
  - what was attempted
  - what failed
  - what still blocks progress
  - which files or commands the next session should inspect first
- Keep the architecture distinction explicit:
  - local terminal agents preserve local files, shell state, and credentials unless a tool explicitly transmits them
  - cloud or remote workers need a separate policy for what context, files, and approvals may leave the machine

## Related Pages

- [[Agent Skill System Design]]
- [[Open Model Runtime Selection]]
- [[Notion Source Of Truth]]
