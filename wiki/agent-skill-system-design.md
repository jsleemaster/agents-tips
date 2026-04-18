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
- explicit tradeoffs around tool access, context loading, and determinism

## Good Skill Architecture

- Use strong metadata so the agent can detect when a skill applies.
- Keep the entry document short and route detail to referenced files only when needed.
- Separate workflow skills from capability uplift skills.
- Use isolated execution for risky or noisy tasks when the platform supports it.
- Put deterministic transforms in bundled scripts instead of asking the model to re-derive them every run.
- Treat the trigger description as product design, not decoration; it determines whether the skill is loaded at all.
- Package instructions, scripts, and references together so the skill behaves like an operable tool surface rather than a loose prompt snippet.
- Treat reusable skills as installable artifacts, not loose prompt text, once teams need version pinning, provenance, and explicit update policy.

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
- When the runtime supports it, the extra fields worth using are the ones that materially change execution:
  - tool allowlists
  - isolation mode such as forked context
  - lifecycle hooks
  - agent or model selection
- Keep trigger metadata concrete enough to match operator language:
  - user-visible nouns like file types, workflow names, or artifacts
  - phrases such as "use when" that describe the real activation situation
- Repository-level agent definition files such as `.agent.md` are useful when the team needs reusable defaults that travel with the codebase instead of with one developer profile.

## Design Principles

- Progressive disclosure is critical: load metadata first, then the main skill, then supporting files only if needed.
- Deterministic work belongs in scripts; descriptive guidance belongs in markdown.
- Hooks should enforce hard invariants, not style preferences.
- Skills should improve future sessions, not bury every insight in chat history.
- Split a skill once the main file becomes large enough that unrelated scenarios would load unnecessary context.
- Keep mutually exclusive paths in separate files so one task does not drag in another task's instructions.
- Distinguish explicit commands from implicit skills:
  - commands are operator-invoked entrypoints
  - skills are opportunistic and auto-triggered from context

## Security And Reliability

- Restrict tool access when a skill does not need the full tool surface.
- Prefer scripts for validation and transformation work.
- Treat unreviewed third-party skills as executable code, not harmless text.
- Supply-chain controls should apply to skills too:
  - publish through immutable releases or pinned refs
  - record repository, ref, and content identity such as tree SHA in installed metadata
  - detect updates from real content change, not only a version label
- Session-level approval modes are part of the skill and agent risk model. A skill that may run under bypass or autopilot-style approvals needs tighter tool scopes, clearer post-run traces, and stronger stop-boundary verification than one that always asks before side effects.
- If the platform supports forked context or isolated execution, use it for high-risk testing, side-effect-heavy exploration, or noisy intermediate work.
- Agent-scoped hooks are useful when the invariant belongs to the skill itself rather than the whole repo.
- When a platform exposes per-skill handler types, match the cheapest control surface to the need:
  - command-style handlers for deterministic validation
  - prompt-style handlers for fuzzy review
  - agent-style handlers only when the check truly needs tools or extended investigation
- Hot reload matters because it shortens the authoring loop; if a platform lacks it, bias toward smaller skills and cheaper test cycles.
- A mature skill system should support evaluation, A/B comparison, and trigger tuning so skill quality can be improved from evidence rather than intuition.
- MCP or tool connectivity should have a governance surface, not just a discovery surface; an allowlist is the clean boundary when teams need centralized approval over which external systems agents may touch.
- Traceability belongs in the runtime surface too: permission events, tool invocations, and session traces should be capturable without rebuilding the orchestration layer from scratch.
- When MCP becomes a shared operations interface instead of a personal convenience tool, design for remote hosting, identity flow, telemetry policy, and network boundary selection up front rather than treating them as deployment afterthoughts.
- Sandbox portability matters once skills stop being local conveniences and become shared runtime components; the durable design target is a skill surface that can run against multiple sandbox providers without redefining the workflow contract each time.
- Durable execution belongs in the runtime, not in ad hoc glue:
  - snapshotting and rehydration for long-running tasks
  - explicit workspace manifests for files, outputs, and storage mounts
  - credential isolation so generated code does not automatically inherit sensitive secrets

## Runtime Features Worth Capturing

- Forked context is the clean execution boundary when a skill should investigate, test, or mutate temporary state without contaminating the parent session.
- Hot reload is not just a convenience feature; it shortens the authoring loop enough that smaller, more aggressively iterated skills become practical.
- Agent-scoped hooks are the right layer when an invariant belongs to one skill rather than the entire repository policy.
- Direct slash-style invocation and auto-triggered invocation solve different problems:
  - slash entrypoints are explicit operator commands
  - auto-triggered skills are opportunistic and context-driven
- Per-skill model selection is only worth encoding when the workload genuinely differs from the repo default; otherwise it adds routing complexity without enough operational gain.
- A production agent runtime should expose the operating primitives directly instead of forcing every team to rebuild them:
  - tool invocation
  - streaming
  - file operations
  - multi-turn sessions
  - attachments
  - permission handlers
  - tracing hooks such as OpenTelemetry
  - BYOK model routing
- Runtime competition is moving from thin orchestration libraries to execution harnesses that bundle those primitives with policy boundaries by default.
- Treat `MCP`, `skills`, `AGENTS.md`, and equivalent manifest files as standard contracts between domain procedure and runtime, not as vendor-specific embellishments.
- Treat protocol layering as part of runtime design rather than optional integration detail:
  - `MCP` for tool and data access
  - `A2A`-style protocols for agent discovery, delegation, and cross-vendor coordination
  - signed agent identity artifacts and multi-tenant security flows once agents cross team or company boundaries

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
- Cross-platform packaging is strategically important: if a skill format can travel across agent runtimes, invest in reusable instructions and scripts rather than vendor-specific prompt glue.
- The best bundled code is code the agent can execute without first loading it into model context; this lowers token cost and improves repeatability.
- Frontmatter-heavy skill formats are valuable only to the degree that they unlock actual runtime behavior:
  - forked execution
  - tool scoping
  - hook binding
  - agent or model routing
- Forked-context or isolated execution support is not just convenience. It is the clean boundary for testing risky skills, side-effect-heavy flows, and noisy intermediate work without polluting the parent session.
- Agent platforms are converging on the same reusable control points:
  - repository-scoped agent definition files
  - reusable skills attached to those agents
  - permission frameworks for sensitive actions
  - distributed tracing or telemetry hooks for audit
- Organization-level MCP allowlists are becoming a standard governance surface; discovery alone is not enough when teams need centralized approval over which external systems agents may touch.
- Open standards are splitting the stack into layers instead of one monolithic agent framework:
  - tool-use protocols reduce reintegration cost for internal systems
  - agent-to-agent protocols reduce point-to-point glue across vendors and partner boundaries
  - the durable lock-in surface increasingly sits in skill packaging, identity, and governance, not only in the base model
- Browser debugging, multimodal evidence, and customization files should be treated as part of the reusable agent surface when they materially change task completion, not as optional IDE conveniences.
- When evaluating a skill system, treat the orchestration layer itself as part of the product:
  - can custom agents inherit team defaults predictably
  - can skills be discovered automatically but governed centrally
  - can permission approvals and traces be reused across many workflows instead of hand-built each time
  - can the same branch, diff, approval, and session-log model survive across local IDE, CLI, cloud, and mobile control surfaces
- Build-versus-buy should now be asked at the runtime layer, not only at the model layer. If an existing agent runtime already provides approvals, tracing, attachments, tool execution, and BYOK, the differentiated work is usually the domain tools and policy rather than a custom orchestration shell.
- Agent-ready enterprise systems need more than an API:
  - a stable CLI for local and CI use
  - an MCP or equivalent read/operate surface for interactive agent loops
  - an SDK or bulk-safe path for high-volume mutations
  - explicit safety rules around which execution path is allowed for which class of action
- Cross-runtime packaging matters more once domain skills become infrastructure. If the same skill bundle can travel across Copilot, Claude Code, or other agent shells, the durable asset is the domain procedure and tool routing policy rather than one vendor's prompt wrapper.
- Enterprise rollout pressure is shifting skill-system design toward observability and access control:
  - telemetry should flow into existing audit or tracing stacks, not only vendor dashboards
  - group or role boundaries should determine which agents, skills, or capabilities are exposed
  - rollout should be gradual enough that teams can enable agent surfaces per group instead of all at once
- Skill-authoring maturity should be measured with real feedback loops:
  - A/B compare alternate skill versions
  - run evals against recurring failure cases
  - tune trigger descriptions from observed misses and false positives
  - track token cost and success rate as first-class design signals
- Standardize the agent access layer separately from the agent choice itself:
  - centralize authentication, permissions, telemetry, and cost controls even when teams use different task-specific agents
  - treat agent selection as a portfolio decision at the workflow level, not a reason to duplicate governance for every tool
- Company-wide agent platforms create a new lock-in surface above the model layer:
  - orchestration ownership matters more once agents share memory, permissions, and cross-system connectivity
  - design the runtime so teams can swap or mix agents without rebuilding the policy and data-connectivity layer from scratch
- Once enterprise platforms shift from point solutions to company-wide agents, the durable control layer is the shared runtime: permissions, memory boundaries, system connectivity, and observability matter more than any one model benchmark.
- Cross-runtime skill packaging is more credible once open standards emerge; when a bundle can travel across multiple agent shells, the durable asset is the procedure, scripts, and policy surface rather than a vendor-specific prompt wrapper.
- Production agent guidance is converging on the same architecture defaults:
  - supervisor plus specialist decomposition over one giant agent
  - deterministic code paths for retrieval, validation, and safety-critical actions
  - open protocol boundaries for tool connectivity instead of one-off wrappers
- Evaluate skill systems and agent runtimes like infrastructure products:
  - how well they isolate credentials and execution
  - whether state can survive container or session loss
  - whether permission, telemetry, and storage boundaries are explicit enough to audit

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Notion Source Of Truth]]
