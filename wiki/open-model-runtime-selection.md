---
title: Open Model Runtime Selection
aliases:
  - Local Model Selection
  - Gemma Vs Qwen
tags:
  - models
  - runtimes
  - local-llm
---

# Open Model Runtime Selection

This page compiles the model/runtime decisions surfaced by the Notion source pages from `🔗 링크 정리`, especially the Gemma 4 and Qwen 3.6 entries.

## Current Working Heuristic

- Use a small local open model when privacy, cost control, or on-device responsiveness matters.
- Use a stronger hosted model when the answer depends on deeper reasoning over weakly structured evidence.
- Separate retrieval quality from model quality; a stronger model does not fix missing citations.
- Treat context-window pressure as a first-class routing signal, not a secondary benchmark detail.

## Gemma 4 Signal

- Gemma 4 is notable because it frames small open models as agent-ready runtimes rather than toy local models.
- The E2B and E4B line is especially relevant for laptop-class deployment.
- Source notes highlight four sizes: E2B, E4B, 26B MoE, and 31B Dense.
- Apache 2.0 matters operationally because it lowers friction for commercial use, internal deployment, and fine-tuning.
- Native structured output, function calling, and multimodal inputs are the real runtime signal; they determine whether an open model can act as an agent substrate rather than only a summarizer.
- The strongest design implication is that local structured-output agents are now practical enough for product workflows, not only demos.
- Gemma-class local runtimes are strongest when procurement or data-governance pressure makes self-hosting a product requirement, not just a cost preference.
- Gemma 4 Multi-Token Prediction drafters shift the runtime decision from "can a local model answer?" toward "can it answer fast enough for interactive agents?" because they target latency and throughput without changing the verifier model.
- Treat MTP drafters as an inference-architecture upgrade, not a model-quality upgrade: the main Gemma 4 model still verifies the speculative tokens, so the product question is responsiveness, battery, and local throughput.
- Gemma 4 12B adds a more concrete edge-deployment threshold: if a multimodal agent can run inside roughly 16GB of VRAM or unified memory, laptop and field-device workflows should be evaluated before defaulting to a hosted vision or audio stack.
- Unified multimodal designs change the architecture question from "which encoder should we bolt on?" to "does one compact backbone reduce latency, memory pressure, and integration cost enough for the workflow?"
- Treat ecosystem availability as part of the runtime signal: Hugging Face, Kaggle, Ollama, llama.cpp, MLX, vLLM, and SGLang support makes a local model more testable across laptop, server, and edge prototypes.

## Qwen 3.6 Signal

- Qwen 3.6 pushes the opposite frontier: long context, stronger coding performance, and aggressive price/performance in API form.
- Source notes claim a 1M-token context window, multimodal support, and repo-scale coding workflows.
- Source notes also position it as practical for design-to-code and full-repository coding lanes, not only text-heavy question answering.
- The practical takeaway is that a cheap hosted reasoning layer may beat a purely local stack when the workload needs deeper synthesis across large corpora.
- The important signal is not just price, but the combination of very long context and coding-agent compatibility.
- Official compatibility with agent shells such as Claude Code, Cline, and OpenClaw is a deployment signal: ecosystem fit can matter as much as raw benchmark wins when the real question is adoption friction.
- DeepSeek-V4 adds a more specific runtime test for open frontier models: a 1M-token claim only matters if FLOPs, KV cache pressure, and prefill cost stay low enough that a long agent session remains affordable.
- Tool-call schema stability and reasoning-trace persistence are runtime signals, not trivia: if a model cannot preserve structured calls or multi-turn reasoning across tool loops, the headline context window is less meaningful.
- Qwen3.6 open-weight releases add another coding-agent signal beyond the Plus API: compare repository-level reasoning, front-end workflow completion, and long-session thinking preservation before treating leaderboard score as the main adoption criterion.
- When a model family ships its own terminal agent surface, such as Qwen Code, evaluate model and host together; adoption friction can drop when the runtime, prompts, tool loop, and workflow assumptions are co-designed.

## Decision Rule For This Wiki

- Start with a local model when:
  - the wiki is closed-world
  - the source corpus is modest
  - latency and privacy matter
  - the main need is summarizing or shaping already-retrieved evidence

- Escalate to a stronger model when:
  - retrieved evidence is broad and conflicting
  - the answer needs stronger synthesis than formatting
  - the local model repeatedly underperforms on the same decision class
  - the task genuinely benefits from repo-scale or corpus-scale context

## Routing Thresholds

- Prefer the local default when the answer can be assembled from a few wiki pages plus short supporting excerpts.
- Escalate when context management itself becomes the problem:
  - a large repository must be reasoned over as one unit
  - the source set is too broad to chunk safely
  - the question depends on reconciling many competing signals at once
- Do not escalate just because a benchmark looks better; escalate when the workload shape actually matches the benchmark advantage.
- Prefer hosted escalation sooner when the model is already available inside the enterprise control plane or cloud platform you must use; procurement and integration friction can dominate pure token economics.
- For long-running coding or research sessions, treat sustained throughput, peak-hour throttling, and session-usage limits as routing signals; a slightly weaker model with stable capacity can beat a better benchmark that stalls mid-run.
- Compare regional capacity, rate-limit headroom, and session continuity policies alongside price and raw model quality when choosing a hosted default.
- For internet-exposed AI endpoints, compare per-request abuse defense, anomaly telemetry, and cost caps alongside model price; session-level auth is too weak when an attacker can resell high-cost inference through many accounts or proxies.
- Prefer runtimes or gateways that can verify the current request inside the route handler, not only at login time, when prompts, model choice, or token volume are user-controlled.
- For enterprise coding suites, score model lifecycle policy before headline quality: LTS duration, default-model pinning, fallback behavior, deprecation windows, and premium-request multipliers can matter more than one benchmark tier when approval latency and cost control dominate adoption.
- For large-scale agent products, treat reserved capacity, power availability, and accelerator-architecture lock-in as runtime signals alongside model quality; a nominally better model can still lose if procurement or regional supply cannot hold the workload.
- For large-scale hosted deployment, score grid-connected power, site readiness, cooling density, and data-center execution partners alongside reserved capacity; AI-factory rollout speed can matter more than nominal accelerator access.
- For AI-factory or sovereign capacity plans, include rack-level supply, liquid-cooling readiness, power-distribution gear, energy-price exposure, carbon reporting, and data-localization constraints; cloud region availability alone under-describes deployment risk.
- Prefer runtimes with native webhooks, retry semantics, and idempotent completion events when the workload includes long-running batch, research, or generation jobs; polling-heavy APIs create orchestration debt even when the base model is strong.
- For multi-agent or long-lived sessions, compare runtimes on cache hit rate, compaction behavior, and token-per-task economics, not just price per million tokens.
- For coding-agent suites with usage-based billing, model cost as token volume plus adjacent automation meters such as CI or code-review minutes; require pooled budgets, admin caps, model-routing policy, and heavy-user guardrails before expanding autonomous workflows.
- For coding assistants that span IDE, CLI, mobile, web chat, PR review, and issue triage surfaces, route by surface and risk: small purpose-built coding models fit repetitive local edits, short questions, and lightweight reviews, while architecture decisions, security-sensitive code, repo-scale reasoning, and long task execution still need stronger models plus verification loops.
- For enterprise AI suites with credit-based usage, require product/model/user attribution, workspace defaults, group limits, individual overrides, user-visible remaining budget, exception-request context, and Cost API or warehouse export before treating rollout cost as governed.
- For agent workloads with repeated long prefixes, compare distributed KV cache design, prefix reuse, and cross-instance session routing before trusting raw token/sec claims; serving architecture can dominate model quality once sessions span dozens of turns.
- Compare managed execution surfaces, not only model APIs, when the product is agent-heavy: sandbox isolation, persistent sessions, file or state resume, observability, and local-to-cloud or IDE-to-mobile handoff paths can dominate adoption more than a small model-quality delta.
- For managed agent APIs, compare whether long-running sessions can persist files and state across follow-up calls, recover via snapshot or rehydration, and keep compute isolated from the harness that holds credentials.
- For enterprise managed agents, sandbox placement and private-tool connectivity are runtime signals: customer-owned execution, outbound-only MCP tunnels, egress controls, and audit-log ownership can decide adoption before model quality does.
- For company-wide agent layers, evaluate permission model, business-context memory, system integration, and operating-layer ownership before treating the product as another point assistant.
- For coding or browser agents, score long-running workflow reliability alongside headline benchmark quality: session endurance, self-correction rate, tool-step efficiency, and end-to-end task completion often predict operating cost better than a one-shot coding score.
- For hybrid runtimes, compare measured cloud-token reduction, PII-masking quality, and offline-local fallback instead of accepting `local-first` as a marketing label.
- When an operating system ships an in-box planning or tool-calling model, treat OS-owned runtime capabilities as a distinct tier rather than lumping them into generic `local`: compare permission inheritance, hardware abstraction, file proximity, and sub-agent support against both app-bundled local models and hosted APIs.
- For BYOK or local-provider agent shells, prefer fail-closed routing over silent fallback to a vendor-hosted model; predictable failure is safer for cost control, auditability, and data-boundary enforcement.
- If the runtime uses sub-agents or helper workflows, verify they inherit the same provider, offline, and telemetry policy as the parent session; sovereign routing is weaker than it looks when helper agents quietly escape to the vendor cloud.
- When a vendor exposes declarative agent manifests such as `AGENTS.md` or `SKILL.md`-style runtime customization, treat that as a runtime signal rather than documentation polish; versionable execution defaults usually scale better than prompt-only setup once agents move across desktop, CLI, mobile, and cloud surfaces.
- If a coding agent product suddenly degrades, check runtime defaults before swapping models: reasoning-effort changes, stale-session retention bugs, compaction policy, and prompt-layer edits can produce larger regressions than the underlying API model.
- Prefer realtime runtimes when the product is voice-first and needs session memory, interruption recovery, parallel tool calls, and live translation inside one loop rather than as separate stitched services.
- When a vendor runtime is distributed through an existing cloud control plane, score procurement convenience and security-boundary reality separately; shared IAM, billing, and audit logs do not automatically mean the model executes inside the same boundary.
- For sovereign or regulated workloads, evaluate deployment topology as a first-class runtime dimension: on-prem or dedicated hardware options, local zones, private fine-tuning boundaries, operator-access guarantees, and local-language model availability can outweigh raw benchmark wins.
- For laptop-class or edge-local routing, compare active parameter count, mixed quantization scheme, memory bandwidth, and usable tokens/sec before assuming a hardware refresh is required; architecture changes can move the local-feasibility line faster than device cycles.
- For local multimodal agents, compare the full pipeline footprint, not just model weights: separate image or audio encoders can erase the memory and latency advantage of a small backbone.
- For high-volume AI products, evaluate the routing layer as a control plane rather than a convenience wrapper: task-class routing, fallback policy, outage handling, latency envelopes, and spend ceilings can matter as much as the default model choice.
- Treat model marketplaces and routers as runtime candidates when they expose enough cost observability, provider health, and governance to prevent a single-model dependency from turning into an outage or margin risk.
- For agentic products with many subcalls per user request, optimize routing economics before fine-tuning prompts endlessly; cheaper intermediate models, expensive final reasoners, and explicit fallback ladders can change unit economics more than a small benchmark gain.
- For local open-model deployment, score runtime portability alongside model quality: GGUF compatibility, llama.cpp integration, and Vulkan-backed GPU paths can matter more than a small benchmark delta when AMD, Intel, and NVIDIA hardware coexist.
- Treat Ollama-style runtime updates as deployment-surface signals when they widen model-family support, quantization paths, or default GPU acceleration; they reduce switching cost even when they do not change the underlying model.
- For enterprise coding agents, treat data-plane proximity as a runtime signal: hybrid or on-prem placement near existing code, documents, and systems of record can matter more than a benchmark delta if SaaS egress or policy boundaries would block adoption.
- For hybrid agent runtimes, compare step-level routing policy rather than only the presence of local mode: sensitive or repetitive steps should be able to stay local with privacy-aware escalation, offline fallback, and measurable cloud-token reduction.
- When agents may buy tools, APIs, or MCP-backed resources during execution, compare runtimes on spend governance, wallet or identity binding, transaction observability, and approval hooks rather than treating payment as app-layer glue.
- For open-weight deployment, compare structural safety scans, checkpoint provenance, and release-gate automation alongside benchmark quality; prompt-response evals alone are too slow and too gameable for supply-chain screening.
- When choosing a quantized local runtime, measure whether safety or refusal fingerprints drift materially after quantization instead of assuming smaller weights automatically break the deployment gate.
- For agent infrastructure planning, score control-plane CPU throughput, memory bandwidth, sandbox density, and energy efficiency alongside accelerator specs; orchestration, tool calling, and long-context state management can bottleneck on CPU or memory systems before raw GPU inference does.
- For private or enterprise inference clusters, capacity-plan agent workloads against host CPU saturation, NIC or east-west traffic limits, session memory pressure, rack power density, and throughput per watt; GPU utilization alone can hide the real bottleneck.
- For campaign-operation or bidding workloads, compare inference latency, data locality, attribution quality, auditability, and GPU-hour efficiency alongside model quality; revenue-linked agent loops fail when serving cost or real-time constraints are treated as creative-tool afterthoughts.
- When a vendor promises autonomous improvement, compare how fast production traces can turn into evals, rollback signals, and post-training updates; a short training-to-inference feedback loop can matter more than a marginal inference-price win once the agent is live.
- For enterprise coding-agent selection, compare review latency, handoff quality, CI or rollback fit, and governance compatibility alongside benchmark quality; adoption often fails on orchestration economics before it fails on model capability.
- In regulated or high-risk domains, evaluate whether the runtime ships as a mission-governed deployment program rather than a generic SKU: trusted-access gates, partner vetting, allowed-workflow scope, and domain safeguards can matter more than raw model capability.
- If agent failures mostly come from stale state, fragmented retrieval, or token-heavy context stitching, treat the context runtime as the selection problem before changing models: governed structured access, durable memory, freshness, and cache reuse can move task completion more than another benchmark tier.
- For ML-heavy agent workflows, score whether the runtime can provision burst GPU or TPU capacity from the local terminal, execute scripts remotely, stream logs, recover artifacts, and clean up sessions without a separate MLOps bridge.
- For reliability-sensitive products, compare harness strength before model size: deterministic validators, dataset checks, citations, audit trails, fallback rules, and correction-loop latency can let weaker or local models satisfy workflows that frontier-only routing would make too expensive.

## Current Recommendation

- Keep `gemma4:e4b` as the default local answer-shaping runtime.
- Treat larger or hosted models as optional final reasoners, not mandatory defaults.
- Improve the wiki and retrieval layer before blaming the model for weak answers.
- Treat a long-context hosted model as the fallback for codebase-wide synthesis, benchmark-sensitive coding tasks, or cases where chunking would distort the answer.
- Prefer Gemma 4 MTP drafter support when local latency is the blocker for chat, voice, coding-assistant, or multi-step agent loops; it is less relevant when retrieval quality or reasoning depth is the limiting factor.
- Test Gemma 4 12B-class runtimes when multimodal local execution or offline operation is the blocker; the decision should be based on end-to-end pipeline footprint, not only whether text generation is fast.

## What To Add From Future Notion Links

- benchmark claims only when they affect an actual design decision
- deployment constraints
- pricing thresholds
- capacity policy and usage limits
- latency or memory implications
- speculative decoding and drafter availability
- product fit: local runtime, hosted API, or hybrid

## Current Tradeoff Snapshot

- Gemma-style local runtimes are strongest when:
  - privacy and control dominate
  - the corpus is already curated
  - structured outputs and tool use matter more than frontier reasoning depth
  - sparse MoE layouts, mixed quantization, or reasoning-tuned smaller dense models materially expand what the current hardware can run
- Orchestration-heavy local stacks are strongest when:
  - skill persistence and contained sub-agents let smaller open models stay coherent over long sessions
  - the main bottleneck is long-running stability or tool-loop organization rather than one-shot benchmark quality
  - local hardware can sustain the active-parameter footprint even if the headline model family sounds smaller than a cloud frontier option
- Qwen-style hosted runtimes are strongest when:
  - context length is the primary bottleneck
  - coding-agent workflows need broader synthesis
  - price per million tokens materially changes viability
  - the provider can sustain long sessions without severe peak-time throttling
- Workflow-oriented hosted runtimes are strongest when:
  - long-running jobs should complete by callback rather than polling
  - retries, event logging, and orchestration reliability matter as much as answer quality
  - the provider already behaves like a workflow runtime instead of a raw inference endpoint
- Reliability-tuned frontier runtimes are strongest when:
  - the product depends on long multi-step coding, browser, or computer-use sessions
  - tool-step efficiency, judgment, and recovery behavior matter more than single-answer benchmark spikes
  - the team can verify real workflow completion rates instead of relying on static benchmark deltas
- Cloud-distributed vendor runtimes are strongest when:
  - enterprise IAM, consolidated billing, and audit visibility must stay inside an existing hyperscaler control plane
  - the team wants native vendor features without separate account sprawl
  - the disclosed execution boundary still satisfies the real security review
- Enterprise data-plane runtimes are strongest when:
  - sensitive code, documents, or operational systems must stay near existing hybrid or on-prem infrastructure
  - system-of-record connectivity and audit boundaries matter more than IDE-side convenience
  - the adoption blocker is data movement or governance, not model availability
- Context-engine runtimes are strongest when:
  - the real bottleneck is fragmented retrieval, stale state, or ad hoc text-to-SQL glue rather than one-shot reasoning quality
  - structured entities, relationships, and access rules need to become a governed retrieval surface instead of prompt-time improvisation
  - token caching, session memory, and fresh operational data should share one low-latency runtime layer
- Sovereign deployment paths are strongest when:
  - residency alone is not enough and operator access, fine-tuning locality, or hardware placement are contractual requirements
  - public-sector, finance, or regional-language constraints shape the runtime choice as much as model quality
- Realtime voice runtimes are strongest when:
  - voice is the primary action surface rather than a thin UI layer
  - session context, tool transparency, and multilingual turn-taking must stay inside one runtime
  - pricing and latency must be evaluated in audio-token or per-minute terms, not only text-token terms
- Payment-native agent runtimes are strongest when:
  - agents need to purchase data feeds, APIs, or MCP services inside the execution loop
  - budget limits, transaction traces, and wallet scope should be enforced by the runtime rather than handwritten into each app
  - pay-per-call ecosystems are part of the product design, not an edge case
- Framework-centered runtimes are strongest when:
  - the same model artifact must move from training into serving without backend-specific forks
  - export paths, graph capture, and quantization formats stay portable across multiple accelerator targets
  - runtime choice should reduce authoring-to-deployment friction, not just maximize benchmark speed on one stack
- Burst accelerator runtimes are strongest when:
  - agents need short-lived GPU or TPU jobs for fine-tuning, evaluation, preprocessing, or artifact generation
  - local repo context must stay connected to remote execution, logs, and downloadable outputs
  - fixed accelerator clusters would add more procurement and idle-capacity cost than the workflow justifies
- Validation-harness runtimes are strongest when:
  - answer correctness can be mechanically checked against source data, calculations, or policy rules
  - citations, lineage, and audit trails are product requirements rather than nice-to-have explanations
  - reducing model burden with deterministic checks matters more than buying a stronger first-pass reasoner
- Hardware-portable local runtimes are strongest when:
  - the team has mixed AMD, Intel, NVIDIA, Apple, or edge hardware
  - GGUF or equivalent package formats let one model chain move across devices
  - common runtime support matters more than a vendor-specific peak-throughput path
- Abuse-aware API runtimes are strongest when:
  - high-cost inference is reachable from public routes
  - attackers can control prompts, token volume, or model choice
  - per-request verification, spend ceilings, and abuse traces are available in the same control plane as routing
- Agent runtime choice should include inference-engineering signals such as prompt caching, cache locality, speculative decoding, compaction frequency, and sub-agent fan-out cost.
- Long-session serving stacks are strongest when they preserve session stickiness, keep distributed cache hit rate high, and reduce TTFT for reused prefixes; otherwise a nominally strong model can still lose on agent turnaround time.
- Treat the runtime as model plus serving layer plus prompt policy; context-window headlines are weaker evidence than stable tool-call schemas and reasoning-state retention across long tool loops.
- Treat single-score community benchmark curves as routing hints, not standalone proof; they are most useful when they explain why an architecture unlocks a new deployment tier on unchanged hardware.
- Neither model class compensates for weak retrieval, stale source curation, or vague task framing.

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Agent Skill System Design]]
- [[Notion Source Of Truth]]
