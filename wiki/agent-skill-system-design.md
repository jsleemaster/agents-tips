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
- Keep skills and custom commands distinct: commands are explicit operator entrypoints, while skills are reusable capability packages that should load only when the runtime can infer relevance from metadata.
- Treat plugins as higher-order packages when they bundle skills, hooks, subagents, and MCP servers together; the install unit should describe the whole execution surface, not only the prompt text.
- Prefer standards-compatible folder shapes when the same skill corpus must run across multiple agent shells; isolate runtime-specific assumptions in narrow adapters instead of the core skill.
- Once agents become long-running workers, question loops, session status, and elapsed-time visibility are part of the architecture, not optional UI garnish.
- Treat `AGENTS.md`, `SKILL.md`, manifests, and workspace declarations as versioned runtime contracts when the same workflow must move across desktop, CLI, SDK, mobile approval, and cloud execution surfaces.

## Security And Reliability

- Restrict tool access when a skill does not need the full tool surface.
- Prefer scripts for validation and transformation work.
- For hook-based enforcement, use the cheapest surface that works:
  - command handlers for deterministic blocking and formatting
  - prompt handlers for model-judgment validation
  - agent handlers only when file-aware investigation or tool access is required
- Treat unreviewed third-party skills as executable code, not harmless text.
- Audit bundled scripts, dependencies, and frontmatter together; metadata is part of the executable surface because the runtime may inject or route on it.
- If the platform supports forked context or isolated execution, use it for high-risk testing, side-effect-heavy exploration, or noisy intermediate work.
- When the runtime offers multiple isolation modes, treat worktree-isolated execution as the safe default and same-workspace editing as an opt-in fast path.
- For managed agent platforms, treat sandbox ownership, egress policy, file persistence, state snapshotting, and restart recovery as part of the reusable workflow package rather than a vendor footnote.
- When private MCP servers are exposed through tunnels, package the outbound gateway, reachable resources, delegation scope, and audit path with the skill so internal connectivity does not become an implicit trust boundary.
- Agent-scoped hooks are useful when the invariant belongs to the skill itself rather than the whole repo.
- Use forked or isolated context for skill development and evaluation when a failed experiment would otherwise pollute the main session state.
- In regulated or domain-heavy environments, the reusable unit is often a workflow package rather than a naked skill: connectors, governed data access, approval steps, and audit logs should ship with the task surface instead of being left implicit.
- If enterprise data access is part of the workflow, package connector scope and permission expectations with the skill so the runtime can enforce the right boundary instead of improvising it at call time.
- For system-of-record workflows, exposing MCP or API access is not enough; the action surface should inherit delegation scope, process control, and audit trail from the underlying business system.
- For customer-service agents, do not evaluate the package only on deflection rate; require resolution evidence, customer consent capture, escalation policy, channel-consistent rules, CRM record updates, and data-quality checks.
- When a skill acts on behalf of a real user in SaaS or internal systems, prefer delegated OAuth, session binding, scoped tokens, and callback separation over long-lived shared credentials.
- Treat shadow-agent detection and inventory as part of skill architecture, not only security operations: local agents, cloud agents, MCP endpoints, linked identities, and reachable resources should be mappable per workflow.
- Enterprise rollout is increasingly a managed-distribution problem: approved plugins, default hooks, MCP allowlists, and auto-install behavior should be treated as centrally deployed platform policy rather than per-user preference.
- When the execution surface is a managed desktop or VDI rather than a clean API, treat IAM scope, audit trails, screenshot retention, and managed MCP endpoints as part of the governed skill package instead of out-of-band platform setup.
- Managed AI gateways are becoming the enterprise policy plane for agents: MCP exposure, provider routing, capacity controls, guardrails, usage analytics, and audit tables increasingly ship as one surface instead of separate per-tool decisions.
- When a data platform already owns permissions, OAuth, and audit, evaluate whether agent routing and MCP exposure should live in that same gateway rather than in a separate model router plus app-side allowlists.
- In enterprise stacks, treat API mediation and secrets handling as part of the skill architecture itself; the reusable unit is often a governed control plane that spans tool calls, data access, and human approval boundaries.
- For realtime voice agent skills, package microphone permission, short-lived browser tokens, provider-key hiding, session timeout, interruption handling, audio-cost attribution, spend controls, and trace correlation with model routing; STT-to-LLM-to-TTS glue is too weak a production unit.
- Voice skills should preserve evidence from the actual live session: barge-in events, background-noise triggers, pause or wake behavior, transcript gaps, device context, and recovery actions belong in traces so failures become reproducible acceptance tests.
- Prefer identity-aware MCP gateways and verified connector libraries over free-form connector sprawl when the workflow touches SaaS or internal systems; connector provenance, discovery policy, and approval semantics should be governed at the same layer as access control.
- Treat MCP connector count as a weak success metric; the stronger design question is whether discovery, authorization, policy enforcement, and audit trails are governed as one action path.
- Separate MCP gateway routing from action authorization: production agents need user-agent-resource-action decisions, just-in-time delegation, standing-permission removal, reliability evidence, and tool-call audit trails rather than only a larger tool catalog.
- For vendor-hosted MCP surfaces, design the connector package around concrete permission lanes: app-only read access, user-delegated write access, token refresh storage, rate-limit policy, abuse detection, and action logs should be visible before the skill treats the endpoint as trusted infrastructure.
- If a workflow skill exposes a shared chat or channel surface, package channel-scoped memory, tool access, requester identity, spend limits, activity logs, and data-sensitivity rules with the skill; shared context increases value only when the permission and audit boundary is explicit.
- For browser-capable or local-control-plane skills, require authentication, authorization, command allowlists, sandboxing, egress policy, and telemetry around MCP or WebSocket endpoints; loopback-only access is not a trust boundary once untrusted web content can drive the agent browser.
- For IDE-embedded browser tools, package tab-sharing rules, isolated agent sessions, sensitive permission approval, domain allow/deny policy, screenshot retention, console-error capture, and scripted-flow evidence with the workflow instead of treating browser access as a generic tool grant.
- If a skill can inspect or trigger CI/CD systems, package remote-run scope, log visibility, rerun permissions, and patch-level security expectations with the workflow; build control planes are high-risk tool surfaces.
- Treat connector generation as part of the skill architecture, not downstream tooling glue: spec-first pipelines should emit SDKs, CLIs, and MCP surfaces from the same contract so agent reach does not drift by language or interface.
- Connector supply chains need the same discipline as model releases: versioned schemas, breaking-change detection, and synchronized rollout of generated client surfaces can determine agent success rates more than another increment of reasoning quality.
- Treat retrieval as its own governed architecture layer rather than a hidden helper under generation: indexed corpora, live source-of-truth connectors, and answer synthesis should expose separate contracts, boundaries, and failure signals.
- For engineering-heavy agents, pair retrieval with a living system map such as a context graph or canonical contract catalog; otherwise code generation speed can amplify context debt and architecture drift.
- For knowledge-heavy agents, keep indexed search and live system access as separate execution paths: semi-static corpora belong to measured retrieval pipelines, while fresh operational state should stay behind scoped connectors with explicit read boundaries.
- For document-heavy RAG or enterprise search, preserve ingestion structure as canonical data: block type, bounding boxes, page or word confidence, layout order, and source-file identity should survive into chunking, citation, redaction, and human-review tools.
- Evaluate OCR or document-AI components as ingestion runtimes, not just extractors: compare quality, latency, self-hosting path, page-level cost, supported formats, and whether confidence metadata can drive HITL review before retrieval.
- When retrieval must traverse structured business state, model entities, relationships, and access rules explicitly enough that the runtime can expose a controlled retrieval or MCP surface from the schema instead of relying on ad hoc text-to-SQL or prompt-only joins.
- Evaluate retrieval independently from generation with relevance metrics or task-level eval sets; otherwise teams cannot tell whether agent failures come from search quality, connector freshness, or model reasoning.
- For multi-vector or late-interaction retrieval, treat vector payload size, shard hydration, cold-start IO, query-side precision, and storage per document as first-class architecture metrics alongside NDCG, MRR, and recall.
- Document-side quantization can be a retrieval-system design lever when document vectors dominate cost; require corpus-specific quality regression, latency p95, storage, and human review for high-risk domains before making it the default.
- For precision-sensitive workflows, package deterministic validators, citations, audit trails, and correction loops with the skill; a stronger model is weaker evidence than a reproducible path from input data to accepted answer.
- For physical-world or lab-connected agents, package the whole closed loop: hypothesis generation, experiment or assay design, automated execution, result ingestion, expert steering, independent replication, scope limits, and misuse controls. Do not label the workflow autonomous if proposal selection, plan correction, lab operation, or final validation still depends on human experts.
- Domain workbenches for science or regulated research should package connectors, curated skills, reviewer agents, reproducible artifact history, data-location boundaries, HPC or SSH permissions, and lineage retention together; a chat assistant is too weak a unit when figures, calculations, citations, and proprietary pipelines must be audited.
- Computational-biology or research-judgment agents need an explicit solver contract: dataset QC, target estimand, allowed tools, analysis-path explanation, final-answer schema, failure-mode disclosure, and domain-expert review gates should be designed before benchmark scores influence deployment.
- Formal verification skills should start as reviewer attention signals around small, human-readable invariants; package theorem-prover setup, compiler or LSP loops, property provenance, counterexample handling, and proof review before making results blocking CI gates.
- AI-assisted remediation should be designed as a governed closed loop rather than a loose coding helper: repo scope, patch generation, fix validation, approval records, and audit-ready evidence should stay in one control path.
- For OSS security workflows, keep expert review and maintainer control inside the package: validation, exploit reproduction, duplicate removal, severity triage, coordinated disclosure, patch submission, and CI evidence should precede any maintainer-facing report.
- AI-assisted code-quality gates should package billing and ownership with the technical scan: enabled repositories, active-committer counts, AI review or autofix metering, runner-minute cost, false-positive triage, and exception policy all shape whether the gate is safe to roll out.
- Permission tiers are becoming part of the runtime architecture itself: keep general assistance, trusted defensive analysis, and higher-privilege patch execution behind separate access gates instead of assuming one model profile should do everything.
- Agentic SDLC workflows should package natural-language intent, compiled CI/CD execution, runner policy, default permissions, sandboxing, output validation, threat detection, and billing ownership together; a markdown task spec alone is not a governed workflow.
- Prefer platform-native workflow identity over personal tokens for reusable agents: built-in tokens, scoped permissions, organization billing, and policy constraints make the skill package auditable without spreading long-lived credentials through automation.
- Semantic code intelligence belongs in the reusable workflow contract for coding agents: language-server setup, index freshness, build metadata, and dependency symbol access should be declared alongside tools and tests so refactor quality is reproducible across CLI, IDE, and CI surfaces.
- Treat AI-brand trust paths as part of skill rollout security: installer distribution, plugin marketplaces, account appeals, billing notices, and model-download links need sanctioned routes because users may be phished through the agent ecosystem before any model or MCP layer is attacked.

## Capability Governance

- Treat skill installation as supply-chain ingestion, not as prompt paste: review owner, license, dependencies, requested access, operating limits, and verification status before letting a skill into a shared registry.
- Prefer machine-readable skill cards or equivalent metadata so provenance, policy checks, and approval status survive outside the original marketplace UI.
- A useful skill card should preserve owner, license, dependency, limitation, verification-status, and provenance fields so registry approval can be audited without opening the marketplace page.
- Runtime sandboxing is not enough once skills move across teams or marketplaces; keep explicit promotion stages such as catalog review, risk scanning, signature or provenance verification, and registry sync.
- Scan skill bundles for agent-specific failure modes as well as normal dependency risk: hidden instructions, prompt injection payloads, risky scripts, credential access, excessive agency, and tool poisoning should all be install-time checks.
- If the platform supports signatures or detached provenance, verify them at install or sync time rather than assuming a trusted download URL is sufficient.
- Treat skill package managers as dependency managers: record source repository, ref, and tree hash or equivalent integrity metadata so installed guidance can be audited and reproduced.
- Prefer tag or commit pinning, immutable releases, secret scanning, and code scanning for shared skill repositories before allowing team-wide installation.
- A skill registry should support search, install, update, publish, and verification as separate operations; conflating them makes it hard to distinguish discovery from approval.
- Treat verified-skill catalogs as capability supply-chain infrastructure: the important boundary is not only what the runtime can sandbox, but whether a team can prove which skill artifact was reviewed, scanned, signed, installed, and later updated.

## Safety As Repo Artifact

- Treat agent safety as an engineering artifact that lives in the repo, not as a separate compliance memo.
- Encode threat-model scenarios as repeatable CI tests so prompt injection, privilege misuse, or unsafe tool chains regress visibly during PR review.
- For stochastic agent behavior, prefer multi-trial or threshold-based safety checks over single-run pass/fail gates; one green run is often too noisy to trust.
- For high-risk system-of-record agents, make pre-deployment validation explicit against standards such as OWASP LLM Top 10, NIST AI RMF, MITRE ATLAS, or an equivalent internal control set.
- Keep design intent, alternatives, failure analysis, and safety decisions in diffable project artifacts such as a dedicated protocol directory instead of slideware or meeting notes.
- Use central review or red teaming as escalation, but make pull requests and regression tests the default loop for everyday agent-safety enforcement.

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
- For revenue-facing campaign or growth agents, include attribution, bidding, creative production, optimization, permissioning, auditability, and measurable efficiency gains in the workflow package; generated copy or images alone are too narrow to prove operational value.
- A strong browser-agent pattern is a thin protected core plus an agent-writable helper workspace: let the agent generate reusable helper code and domain skills from real site interactions, but keep the orchestration layer small and reviewable.
- Skill persistence and contained sub-agents matter more as local stacks shrink: a smaller open model can stay useful if the orchestration layer stores learned corrections and isolates short-lived workers instead of bloating one shared context.
- Browser-agent skills should be evaluated against end-to-end session completion across DOM and non-DOM surfaces; selector stability alone is no longer enough once native dialogs, certificate pickers, browser chrome, and other OS-level prompts sit inside the same managed runtime.
- Treat agent-callable browser surfaces as a first-class interface, not a hidden implementation detail: explicit tool schemas, shared state, permission policy, and confirmation boundaries can outperform pure DOM heuristics on long multi-step flows.
- Treat `action -> screenshot -> reaction` as the core runtime primitive for modern computer-use or browser-agent workflows: the useful abstraction is a full session loop with vision feedback, not a one-shot DOM command.
- As UI-executing agents move from browser demos into enterprise automation, package action allowlists, bounded screen scope, step-level evidence logs, and human handoff paths with the workflow instead of treating them as deployment-time afterthoughts.
- Browser-agent stacks increasingly need a standard debug surface for WebMCP registration, extension/background-script behavior, browser dialogs, and full accessibility trees; agent readiness is becoming a first-class browser-tooling concern rather than a custom harness add-on.
- When evaluating browser skills or agent-ready sites, look for compatibility audits or equivalent diagnostics for callable surfaces and dialog flows; DOM selector success alone is too narrow once the browser itself exposes agent-aware tooling.
- Treat runtime browser debugging as a first-class skill surface, not only a fallback after DOM automation fails: agent-callable DevTools or equivalent should expose Lighthouse audits, device and geolocation emulation, CPU or network throttling, and runtime inspection as reusable verification tools.
- When computer-use ability becomes a built-in model tool rather than a separate preview model, treat the workflow package as screen action plus policy: action approval, sandboxing, credential scope, prompt-injection stop rules, audit logs, rollback paths, screenshot retention, PII masking, and app allowlists should be designed before measuring click success.
- Split computer-use policies by workflow risk; software QA, back-office automation, and irreversible user-account actions should not share the same confirmation threshold or evidence-retention rule.
- When a platform spans desktop, CLI, mobile approval surfaces, and managed cloud execution, keep the reusable agent contract in versioned manifests or skill files rather than chat-only instructions; execution-surface continuity is part of the architecture, not a UX afterthought.
- When a product surface is exposed to agents as structured actions rather than screens, treat capability registry, confirmation UX, abuse prevention, and action-scoped observability as part of the interface contract, not only app-level polish.
- When a system of record becomes agent-executable through MCP or workflow APIs, model the underlying business object or state machine directly and attach approval boundaries there instead of bolting a generic assistant onto the UI.
- When standardizing a team skill stack, distribute plugin marketplace choices, always-on hooks, and MCP defaults together so the reusable unit is a governed execution surface rather than a loose prompt bundle.
- As agent ecosystems widen, treat discovery and trust as part of the reusable architecture rather than an external registry problem: naming, verification artifacts, and delegation rules should be portable enough to survive vendor or broker changes.
- For open or multi-team agent platforms, keep orchestration config in portable settings files or repo-tracked manifests rather than UI-only preferences; contribution and supervision break down quickly when workflow defaults cannot be reviewed, versioned, or moved across devices.
- Production agent quality should be treated as a reusable system asset: keep trace schema, failure taxonomy, golden eval sets, A/B gates, and rollout criteria with the workflow instead of relying on ad hoc prompt edits after incidents.
- Standardize observability over LLM calls, tool invocations, agent handoffs, and downstream side effects; OpenTelemetry-style `gen_ai.*` semantic conventions or an equivalent trace schema should be treated as architecture, not optional logging polish.
- Treat observability as a closed-loop improvement surface, not only a dashboard: traces should be convertible into eval sets, rollback triggers, and post-training or policy-tuning updates so workflow failures become reusable corrections.
- Agent traces should model retry storms, tool-call chains, token-cost drift, workflow state, and human handoff points in one surface; classic logs and metrics alone under-explain production failures.
- Investigation should be skillized before rollout: trace reconstruction, hypothesis generation, and remediation playbooks belong in the reusable workflow package rather than in ad hoc incident chat.
- Agentic observability should connect logs, metrics, traces, topology, resource health, deploy history, ownership, runbooks, and incident policy into one investigation surface; plain-English log summaries are too weak to govern production agents.
- Keep automated remediation read-only or human-approved until root-cause confidence, blast-radius limits, rollback evidence, and incident history justify narrower autonomous action.
- For agent memory or state layers, evaluate task completion, repeated-run reliability, and token efficiency instead of retrieval hit rate alone; read-only recall benchmarks under-measure production quality.
- Include state-mutating tasks in agent evals whenever memory or workflow state is part of the product, because "remembered the fact" is weaker evidence than "repeatedly finished the job without losing state."
- Enterprise agent competition is shifting from assistant UX toward operating-model depth: the durable design question is whether the stack unifies SDLC actions, data access, API gateways, and ops controls under one auditable control plane.
- For operational control planes, score change safety, rollback reliability, connector blast radius, and audit completeness alongside answer quality; the wrong evaluation surface makes enterprise automation look safer than it is.
- Enterprise adoption bottlenecks increasingly live in workflow redesign and deployment ownership rather than model access alone; FDE-style rollout capacity, policy integration, and post-launch support are part of the architecture decision, not just vendor services packaging.
- When an external FDE team helps build an agentic system, require durable handoff artifacts: semantic-layer schema, governed knowledge-graph ownership, runbooks, eval criteria, security boundaries, cost telemetry, and named internal champions should remain after the deployment team leaves.
- Once rollout moves beyond pilot teams, treat training, certification, Center-of-Excellence ownership, and result-validation responsibility as part of the agent architecture itself; a strong model without a retraining and delivery layer will not scale cleanly through a large organization.
- If the agent platform is intentionally open to community or cross-team contribution, treat roadmap visibility, contribution protocol, verification handoff, and audit-ready change records as part of the product surface rather than auxiliary community management.
- Treat cross-project agent manifests or global `.agent.md`-style defaults as a managed baseline layer above repo-local instructions; centralize stable policy there and keep repo-specific overrides narrow.
- Enterprise agent platforms should ship local sandboxing, base-image provenance, trusted package sets, and runtime parity together; secure local experimentation without a production-valid build path is an incomplete platform.
- Treat shared environment protocols as skill architecture when agents must move between training, evaluation, and production: terminal, browser, simulator, Docker, HTTP/WebSocket, and MCP surfaces should be reusable contracts rather than bespoke harness adapters.
- For domain execution protocols, separate the capability model, extension or policy layer, and transport binding; commerce-style actions such as catalog, cart, checkout, orders, identity linking, fulfillment policy, and authorization proof should be discoverable before the agent is allowed to execute them.
- Vulnerability triage for AI-generated code should prioritize runtime reachability and exploitability over raw CVE volume, because generated dependencies inflate noise faster than they change actual risk.
- When frontier cyber models increase vulnerability discovery volume, the reusable package must scale triage and disclosure, not only detection: CVSS, exploitability, asset exposure, duplicate removal, coordinated disclosure, patch capacity, customer notice, SBOM propagation, and regression tests should be part of the workflow contract.
- Enterprise framework-migration skills need executable oracles: build, container startup or deploy, smoke tests, behavior-preserving regression suites, rollback slices, and failure-layer taxonomy should be part of the workflow package before the agent edits large legacy surfaces.
- Score modernization agents on behavior preservation and rollbackability, not only diff similarity or compile success; migration benchmarks are useful when they expose where the agent confuses API translation with delivered service equivalence.
- For open-source or long-lived runtime contributions, AI-generated code policy belongs in the workflow package: require contributor ownership, provenance or disclosure rules, license-contamination checks, maintainability evidence, and risk-tiered exemptions instead of pushing subtle-bug review burden onto maintainers.
- Do not make AI-code detection the primary gate for contribution quality; the stronger boundary is whether the submitter can explain the design tradeoffs, support the code over time, and satisfy the project-specific API, ABI, security, and platform-compatibility contract.
- When AI coding adoption depends on delivery speed, package the workflow around the full execution path: build tool, test runner, bundler, deploy target, and data-service provisioning should be visible to the agent contract rather than left as post-generation handoff work.
- Release-automation skills should treat generated notes as draft artifacts, not authority: source-of-truth PR manifests, missing or extra reference checks, retry loops, raw-output archives, provider swappability, and human release approval belong in the reusable workflow.
- Intent-based infrastructure provisioning is a skill-design boundary, not just a platform feature; the package must declare which resources an agent may create, how those resources are named, and where human approval interrupts the path to production.
- For broad enterprise assistant rollouts, start with workflow-specific adoption surfaces rather than a generic "AI for everyone" skill: writing, summarization, meeting follow-up, policy drafts, and communication-heavy tasks have clearer success signals than fully autonomous workflows.
- Segment enterprise skills by role and output artifact, because large usage logs can be broad but uneven; rollout proof should compare value density by workflow instead of assuming one assistant behavior fits every job family.
- For public-facing or broadly deployed AI products, treat social license as a design constraint: document privacy controls, child-safety boundaries, incident response, liability ownership, human escalation, user education, and workforce-impact handling alongside the technical workflow, because adoption risk can come from trust and governance gaps even when capability is strong.
- For public-sector, education, health, or international AI deployments, package accessibility, regional connectivity assumptions, standards alignment, auditability, local partnership ownership, and responsible-operation evidence with the workflow; global governance pressure can become a product requirement before model quality is the blocker.
- For hiring or other high-stakes human-decision agents, package structured rubrics, prompt and version control, transcript retention, adverse-impact testing, candidate consent, blind-review fallback, human appeal paths, and audit logs before treating efficiency as product value.
- For education agents, package age-tiered access, teacher-supervised modes, answer-generation limits, source or citation discipline, assessment separation, and learning-process logs; school adoption depends on protecting learning stages as much as model quality.

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Notion Source Of Truth]]
