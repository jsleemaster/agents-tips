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
- If a coding agent suddenly feels worse, inspect harness-layer defaults such as reasoning effort, stale-session retention, context pruning, and prompt verbosity before assuming the base model regressed.
- Claude Code already assembles current date, git state, working-tree context, project memory, and tool inventory before it answers; improve those surfaces first instead of restating the same background in chat.
- Separate execution from approval: keep the repo, credentials, and permissions on the machine that owns them, and use mobile or remote surfaces mainly for status checks, questions, and approvals.
- The best workflow is usually:
  - establish durable project rules
  - let the agent act on a bounded task
  - verify with tests or hooks
  - write back the new lesson into durable memory

## Command-Level Habits

- `/init` to generate the initial project memory surface.
- `/compact` to preserve a useful summary while dropping excess context.
- `/clear` or `/reset` when a task boundary is complete.
- `/rewind` or `Esc Esc` to roll back a bad execution branch instead of compensating with extra cleanup edits.
- `/diff` to inspect agent-made changes before commit, review, or handoff.
- `/mcp` for external systems, but only when the tool meaning is crisp.
- `/model` when the problem is really a latency-versus-quality tradeoff; reasoning-effort defaults can materially change coding quality even without a base-model swap.
- `/plan` when the work has multiple moving parts or non-obvious tradeoffs.
- `/security-review` when the task needs a dedicated vulnerability pass instead of informal caution.
- `/context` to inspect token pressure instead of guessing.
- `/cost` when a workflow is drifting into expensive territory.
- `/fork` or `/resume` when the value is preserving a branch of thinking, not one continuously growing session.
- `/teleport` when a useful remote or cloud session should be continued locally instead of recreated from scratch.
- `/pr-comments`, `/plugin`, and `/skills` are the direct surfaces for review feedback intake, plugin inventory, and skill discovery.
- Prefer `Shift+Tab` or `/plan` before execution when the task needs architecture review, test shape agreement, or risk checks; do not pay plan-mode overhead for straightforward local edits.

## Interaction Ergonomics

- Use `Esc` to interrupt a bad generation or tool loop early; recovery is cheaper than waiting for a wrong branch to finish.
- Use `Alt+T` or the equivalent thinking toggle for genuinely hard planning, debugging, or architecture turns, not as a blanket default for every small edit.
- Use `Ctrl+V` to paste screenshots or UI captures directly when visual state matters; direct image input is usually cheaper and clearer than rewriting the scene in prose.
- Use `!` for one-off shell execution and `@` path completion to keep prompts short when the real task is grounded in local files or terminal output.

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
- For large or high-risk repos, prefer worktree-isolated agent execution as the default and treat in-place workspace editing as an explicit speed optimization.
- Treat plan decomposition, parallel execution, and change splitting as one workflow surface; the point is reducing review and merge friction, not only generating code faster.

## Review And Change Shape

- Review ergonomics matter as much as code generation quality once the work leaves the main editing loop.
- Prefer workflows that keep review threads, commit history, and file-tree context visible together so the reviewer can reason about a change without rebuilding state by hand.
- Split oversized changes before handoff when the tool supports it; smaller PR units usually improve both human review quality and agent retry behavior.

## Agent Teams Vs Subagents

- Use subagents when the work stays inside one main session and the parent should remain the control plane.
- Use Agent Teams only when peers need independent context, direct messaging, or long-running coordination patterns.
- Treat Delegate Mode as a coordination-only surface: useful when the lead should assign, monitor, and synthesize instead of doing implementation work in the same context.
- Shared task lists and JSON-style mailboxes are part of the team runtime contract; use them to avoid file-lock contention and invisible cross-agent handoffs.
- Team topology should be chosen deliberately:
  - hub-and-spoke for central orchestration
  - task queue when workers can self-assign
  - pipeline for ordered handoff
  - competitive when multiple candidate solutions are worth comparing
  - worker plus watchdog when one agent should verify another
- Agent Teams are expensive relative to a normal session, with source notes estimating roughly 5 to 7 times the token cost.
- Prefer smaller models for workers, close completed workers quickly, and keep tasks self-contained if using team mode.
- Avoid Agent Teams when the same file needs concurrent edits, when you need nested teams, or when session resume matters.
- For dynamic or large-scale subagent workflows, evaluate the orchestration loop itself: planning quality, task fan-out, verification coverage, and the lead agent's ability to avoid declaring completion before worker evidence is checked.

## Hooks And Guardrails

- Hooks are valuable when a step must always happen, not when it is merely preferred.
- Quality gates are strongest at commit or stop boundaries, not on every tiny edit.
- Deterministic automation should live in hooks or scripts, not in hope that the model remembers.
- The full hook surface also includes `UserPromptSubmit` for prompt validation or context injection and `Notification` for custom alerting; treat them as specialized extensions rather than the default starting point.
- The high-value lifecycle points are:
  - `PreToolUse` for blocking dangerous inputs
  - `PostToolUse` for formatting or local validation
  - `Stop` for end-of-turn checks and self-correction loops
  - `SessionStart` for loading session context
  - `SubagentStop` for verifying delegated work before merge
- Prefer blocking at `git commit` or other durable boundaries rather than on every write.
- A stop-hook feedback loop that checks errors and forces a repair pass is one of the strongest quality multipliers in the source material.
- Treat secret scanning as an agent-native pre-commit guardrail, not only a PR or CI check, when the coding surface already runs through MCP or plugin tools.
- Reuse the same repository or organization push-protection policy inside the local agent loop so secret detection does not drift between local generation, push, and server-side enforcement.
- Treat AI SDKs, agent CLIs, and plugin packages as a supply-chain boundary, not a convenience dependency: pin versions, audit lockfiles and provenance, and check whether any laptop, CI runner, or image pulled a compromised release window.
- When a vendor publishes a package advisory, rebuild dependency caches and container images from clean artifacts and rotate any credentials that may have been exposed; uninstalling the package alone is not a sufficient incident response.

## MCP Guidance

- A few strong MCP entrypoints beat a huge catalog of thin wrappers.
- Tool names and `serverInstructions` should be explicit enough that the agent can choose them without loading the whole schema.
- Stateful browser-style tools are especially good MCP candidates.
- When exposing CI or build systems over CLI or MCP, design auth scope, remote-run permissions, log visibility, and audit traces before treating them like ordinary agent tools.
- Tool search should be on when MCP definitions are large; source notes claim it can cut schema token load by roughly 85 to 96 percent.
- Treat roughly 10 percent of context consumed by MCP definitions as the default threshold where tool search should auto-engage, and lower it with `ENABLE_TOOL_SEARCH=auto:5` when the repo regularly works against especially heavy MCP catalogs.
- `serverInstructions` should describe the real task surface in operator language, not generic transport details.
- Use `project` scope for team-shared MCP contracts and reserve `user` or `local` scope for personal credentials, machine-specific servers, or experiments that should not silently change the repo default.
- `-s local` writes machine-local defaults to `.claude/settings.local.json`.
- `-s project` writes shared MCP defaults to `.mcp.json`.
- `-s user` writes cross-project personal defaults to `~/.claude/settings.json`.
- Use `/doctor` for server-by-server MCP token inspection and `/context` to confirm whether on-demand loading is actually reducing session pressure.
- Prefer MCP for stateful environments like Playwright and prefer CLI for stateless systems where shell commands are already strong.

## CLI And Automation Defaults

- Prefer fast CLI replacements in agent-facing repos:
  - `fd` over `find`
  - `rg` over `grep`
  - `bat` over `cat`
  - `eza` over `ls`
- Use `claude -c` to continue the most recent session, `claude -r <id>` to resume an exact thread, and `claude -w <name>` when a task deserves an isolated git worktree from the first turn instead of midstream cleanup.
- In scripted automation, capture the emitted `session_id` and resume it across steps instead of replaying the whole brief; session chaining preserves the working state more reliably than prompt restatement.
- Store reusable custom commands in `.claude/commands/` when they are project-shared and `~/.claude/commands/` when they are personal; use `$ARGUMENTS` for the variable part instead of baking one-off issue IDs or filenames into the command.
- Let command frontmatter constrain tools when the command is allowed to run shell or Git operations; a command that can inspect status, diff, branch, and recent commits is useful, but it should not silently widen into every tool.
- Non-interactive flags belong in durable project guidance when the agent must avoid blocking:
  - `--json`
  - `--yes`
  - `--quiet`
  - `--format json`
- For scripted or chained runs, prefer explicit control flags such as `-p`, `--output-format`, `--json-schema`, `--allowedTools`, `--max-turns`, and `--max-budget-usd` so automation can validate outputs and stop predictably.
- For automation chains, use explicit output formats, turn limits, budget limits, and allowed-tool lists rather than trusting ambient defaults.
- If a task starts in plan mode, freeze the approved plan into a GitHub issue or markdown artifact before execution so later sessions can detect drift instead of re-deriving intent from chat alone.
- When a workflow repeats, prefer a custom command that captures live context such as `git status`, `git diff`, the current branch, and recent commits instead of making the operator restate repo state by hand.
- Verification should be part of the workflow, not a final optional question:
  - explain how the change will be checked
  - run the test or validation loop
  - only then write durable memory
- For browser-facing changes, do not stop at static lint or unit tests when runtime quality is the real risk; include agent-callable browser checks such as Lighthouse, viewport emulation, CPU or network throttling, and accessibility inspection in the verification loop or PR gate.
- For implementation-heavy tasks, prefer a test-first loop: derive failing tests from the input/output contract, keep the tests fixed while the implementation catches up, and use a separate reviewer pass or subagent to check that the code is not merely overfitting the test cases.
- In a strict TDD lane, commit or otherwise lock the failing tests before implementation so the contract cannot quietly drift during the coding pass.
- For larger changes, keep writer and reviewer passes in separate sessions or subagents so the review context is not contaminated by the implementation path.
- When resetting after a long task, prefer a handoff note that records attempted paths, validation status, and the single next unblocker rather than a prose recap of everything learned.
- For long-running coding or browser-agent workflows, track session endurance, self-correction rate, tool-step efficiency, and end-to-end completion rather than relying on a one-shot model benchmark.

## Related Pages

- [[Agent Skill System Design]]
- [[Open Model Runtime Selection]]
- [[Notion Source Of Truth]]
