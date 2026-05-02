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
- Treat compliance fit as a routing signal too; a model that cannot satisfy residency or regulatory boundaries is not a viable default no matter how good its benchmark.
- Treat shared agent-host model pickers as routing infrastructure, not cosmetic UI; once the same GitHub task surface can dispatch to `Claude Sonnet 4.6`, `Claude Opus 4.6`, `GPT-5.2-Codex`, `GPT-5.3-Codex`, or `GPT-5.4`, the durable decision shifts from one best model to who owns the routing policy.
- Treat portfolio coverage as a routing signal too; a family that spans datacenter-scale MoE, mid-sized local tiers, and edge-capable small models can reduce platform sprawl even when one individual checkpoint is not the benchmark leader.

## Gemma 4 Signal

- Gemma 4 is notable because it frames small open models as agent-ready runtimes rather than toy local models.
- The E2B and E4B line is especially relevant for laptop-class deployment.
- Source notes highlight four sizes: E2B, E4B, 26B MoE, and 31B Dense.
- Apache 2.0 matters operationally because it lowers friction for commercial use, internal deployment, and fine-tuning.
- Native support for function calling, structured JSON output, and system instructions matters more than raw benchmark rank when the target workload is an agent loop.
- Vision and video support widen the cases where a local runtime can stay in the loop instead of escalating immediately to a hosted multimodal model.
- Native audio input on the E2B and E4B line matters because it pushes the smallest deployments closer to complete on-device agent surfaces instead of text-only assistants.
- Google is explicitly positioning the 31B model as a top-tier open model and the 26B model as a smaller but still competitive open option; the important retrieval takeaway is not the leaderboard claim itself, but that agent-ready structured output is now bundled with serious open-model ambition.
- Ecosystem density is part of the signal too; source notes cite roughly 400 million downloads and more than 100,000 Gemma variants, which makes deployment-path breadth a practical routing input rather than vanity telemetry.
- The strongest design implication is that local structured-output agents are now practical enough for product workflows, not only demos.

## Qwen 3.6 Signal

- Qwen 3.6 pushes the opposite frontier: long context, stronger coding performance, and aggressive price/performance in API form.
- Source notes claim a 1M-token context window, multimodal support, and repo-scale coding workflows.
- The price signal is large enough to matter as policy, not trivia: roughly `$0.29` per 1M input tokens versus premium-model pricing an order of magnitude higher.
- Official compatibility with coding-agent surfaces such as Claude Code, Cline, and OpenClaw increases deployment fit for existing agent workflows.
- Immediate availability through Alibaba Cloud Model Studio and Bailian matters because it lowers the cost of running a real routing experiment instead of treating Qwen as a hypothetical future option.
- The practical takeaway is that a cheap hosted reasoning layer may beat a purely local stack when the workload needs deeper synthesis across large corpora.
- The important signal is not just price, but the combination of very long context and coding-agent compatibility.
- Treat reasoning continuity as a routing signal too; if a model explicitly preserves thinking context across iterative turns, that matters for repo-scale coding more than one more leaderboard delta.
- Treat repository-level task completion as a separate evaluation axis from benchmark score; open coding models should be compared on multi-file continuity, not only one-shot code generation.
- Model-plus-agent-surface co-design is a real deployment-fit signal. If the same family ships both the model and a terminal-agent workflow such as Qwen Code, adoption friction can drop even when the raw model is not the consensus frontier default.

## Mistral Small 4 Signal

- Mistral Small 4 reframes the open-model question from single-checkpoint quality to integrated stack efficiency.
- The notable shape is not only the `256k` context window or Apache 2.0 license, but the claim that one model can cover reasoning, multimodal input, and agentic coding without a routing split across separate specialists.
- `reasoning_effort` is an important control-surface signal because it exposes latency-versus-depth tradeoffs inside one runtime rather than forcing a model swap.
- Day-0 support across serving stacks like `vLLM`, `SGLang`, `llama.cpp`, and Transformers is a deployment-fit signal, not a minor implementation detail.
- Throughput claims matter when routing policy is driven by end-to-end loop cost; source notes highlight roughly 40 percent shorter completion time and 3 times higher throughput in optimized setups.
- Output efficiency matters as much as benchmark rank when the real cost driver is loop length and repeated tool turns; shorter successful completions can beat a slightly stronger but more verbose model.
- The practical takeaway is to compare integrated-model operational simplicity against multi-model routing complexity, not just one benchmark table against another.

## DeepSeek V4 Signal

- DeepSeek V4 strengthens the case for keeping ultra-long-context open models in the routing matrix even when they are not the overall benchmark leader.
- The important signal is the bundle of `1M` context, low input pricing, and explicit agentic-coding positioning rather than any one raw leaderboard claim.
- Very low-cost long-context tiers change workload segmentation rules: broad codebase sweeps, document fusion, and high-frequency automation may deserve a different default than ambiguous final reasoning.
- Geopolitical or supply-chain fit can become part of runtime selection when a model family is presented as viable on alternate hardware or regional infrastructure stacks.
- The practical takeaway is to compare total cost of execution for long-context agent loops, not only per-task intelligence.

## Regulated Hosted Runtime Signal

- Compliance posture is now strong enough to count as a positive routing signal, not just a blocker checklist.
- When a frontier provider offers regulated environments such as FedRAMP-moderate managed access, the relevant question shifts from "is hosted allowed at all" to "which product surfaces and models are inside the certified boundary."
- Certification scope should be checked at the product-surface level:
  - chat workspace access
  - API platform access
  - agent surfaces such as cloud coding or Codex-style environments
- Reusable authorization packages and shared evidence lower adoption friction, but only if the team still verifies data-boundary, logging, and responsibility split details for the exact workflow.
- Cloud-native distribution path is a routing signal too:
  - if the model or agent runtime can run inside the organization's existing cloud IAM, billing, and audit stack, adoption friction drops materially
  - cloud-commit alignment can matter as much as benchmark price when spend is already committed elsewhere
  - managed-agent availability inside the host cloud changes the decision from model procurement to workflow placement

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
- Treat provider portability as a routing requirement, not a nice-to-have, when the agent shell must survive model swaps without changing operator workflow.
- Treat regional endpoint availability as a hard capability gate, not a paperwork detail, when residency or government procurement rules apply.
- Treat ecosystem density as a routing signal too:
  - derivative model count
  - community maintenance speed
  - regional language or compliance fit
  - evidence that the model family is actually deployable in the environments you care about
- Treat hardware-fit as a hard capability gate too:
  - whether the target model can run on the actual node class you operate, not just an ideal benchmark rig
  - whether smaller variants cover laptop, workstation, or edge deployments under the same family policy
  - whether the serving stack and compression path are mature enough that deployment friction does not erase the benchmark win
- Keep the routing contract explicit when one host exposes many frontier models:
  - task type decides the default model
  - premium tiers need a clear reliability threshold
  - admins should be able to pre-enable only the model families the workflow is allowed to use
- If the host keeps model choice inside the same issue, PR, or cloud-agent surface, treat that collaboration continuity as real operational value rather than UI polish.
- Treat host-level model pickers as gated infrastructure, not unconditional user freedom:
  - business or enterprise policy may need to enable each vendor family first
  - repository or organization cloud-agent settings may still block execution even when the model appears on the platform

## Routing Thresholds

- Prefer the local default when the answer can be assembled from a few wiki pages plus short supporting excerpts.
- Escalate when context management itself becomes the problem:
  - a large repository must be reasoned over as one unit
  - the source set is too broad to chunk safely
  - the question depends on reconciling many competing signals at once
- Escalate when multimodal evidence or full-repository coding flows would be materially weakened by local model limits.
- Do not escalate just because a benchmark looks better; escalate when the workload shape actually matches the benchmark advantage.
- Do not treat long context as enough by itself; if reasoning continuity collapses across iterative repo work, the larger window does not rescue coding-agent quality.
- Do not treat "1M context" as sufficient by itself; it only changes routing policy when the rest of the agent shell can actually preserve tool use, streaming, and stable repo-scale execution under that larger window.
- Escalate toward a managed hosted runtime when it adds control-plane surfaces the local path does not provide:
  - durable background execution
  - audit logs and trace capture
  - explicit approval boundaries
  - stable parity between local and cloud tool contracts
- Do not choose a hosted runtime if the environment requires an explicit no-fallback guarantee; if silent fallback to a vendor-hosted model would violate policy, the runtime must expose a hard offline mode instead of a best-effort preference.
- Do not treat a premium for compliant routing as noise; residency or regulated endpoints can change effective model cost enough to alter the default.
- For coding-agent shells, treat these capability gates as minimum viability checks before a runtime becomes the shared default:
  - tool calling
  - streaming
  - roughly `128k` context or better
  - consistent behavior across subagents that inherit the same provider configuration
- For enterprise rollout, treat these governance gates as minimum viability checks before a hosted default is acceptable:
  - explicit region availability
  - enforceable data residency policy
  - clear compliance scope such as regulated-public-sector support
  - visibility into which model families are excluded because the compliant endpoint does not exist
- Treat compliance surcharges and defaults as routing inputs too:
  - a residency or regulated-endpoint premium of roughly 10 percent can still change the default for always-on workloads
  - admin opt-in matters because a compliant path that is off by default is not the actual default runtime
- Do not ignore compliance pricing details; a seemingly small residency premium can still change the default routing recommendation when the workload is high-volume or always-on.
- Treat "policy evaluates once" behavior as a real operational risk when access is granted from org properties or rollout metadata that do not auto-reconcile after later edits.
- Treat certification scope as a capability gate too:
  - a regulated endpoint is only useful if the needed model family is actually inside the certified surface
  - hosted chat approval does not automatically imply API or agent-runtime approval
  - reusable authorization evidence speeds review, but it does not replace workflow-level boundary checks
- For open-model adoption, treat these ecosystem gates as minimum viability checks before a family becomes the default:
  - active derivative ecosystem rather than one isolated release
  - enough deployment options across local, self-hosted, and cloud paths
  - evidence that small and mid-sized variants are used in production-like workloads, not only the flagship tier
- Do not confuse model availability with policy fitness; a model is not operationally available if the shared host cannot expose it under the right repo, org, or admin policy.
- For full-stack open-model portfolios, treat these deployment gates as minimum viability checks before the family becomes a serious platform candidate:
  - one policy should be able to span datacenter, workstation, and edge tiers
  - serving-stack maturity such as `vLLM`, compression formats, or accelerator-specific paths should exist on day one
  - hardware-fit claims should name real node classes such as single `8xA100` or `8xH100`, not only aspirational cluster shapes

## Current Recommendation

- Keep `gemma4:e4b` as the default local answer-shaping runtime.
- Treat larger or hosted models as optional final reasoners, not mandatory defaults.
- Improve the wiki and retrieval layer before blaming the model for weak answers.
- Treat a long-context hosted model as the fallback for codebase-wide synthesis, benchmark-sensitive coding tasks, or cases where chunking would distort the answer.
- Keep the default architecture hybrid:
  - local open model for private, bounded, retrieval-backed shaping
  - hosted long-context model for corpus-wide synthesis or agentic coding runs that need broader context than local chunking can preserve
- Prefer agent shells that can preserve the same operator experience across:
  - hosted APIs
  - BYOK providers
  - fully local runtimes
  - air-gapped or telemetry-disabled environments
- Prefer runtimes that fail closed:
  - no silent fallback to vendor-hosted models
  - subagents inherit the same provider and policy boundary
  - offline mode is explicit enough to satisfy audit and cost-control requirements
- Prefer open-model families with strong downstream ecosystems when the goal is long-lived platform leverage rather than a one-off benchmark win.
- When a shared agent host offers multiple frontier models, define a model-to-task matrix instead of letting every invocation pick ad hoc:
  - lower-cost models for routine documentation, initial sweeps, or low-risk review handling
  - stronger models for ambiguous debugging, broad refactors, or high-stakes review threads
  - premium models only where the error-cost curve justifies the spend

## What To Add From Future Notion Links

- benchmark claims only when they affect an actual design decision
- deployment constraints
- pricing thresholds
- latency or memory implications
- product fit: local runtime, hosted API, or hybrid
- family-level portfolio coverage across datacenter, workstation, and edge deployments

## Current Tradeoff Snapshot

- Gemma-style local runtimes are strongest when:
  - privacy and control dominate
  - the corpus is already curated
  - structured outputs and tool use matter more than frontier reasoning depth
  - commercial deployment flexibility matters because Apache 2.0 removes licensing friction
- Qwen-style hosted runtimes are strongest when:
  - context length is the primary bottleneck
  - coding-agent workflows need broader synthesis
  - price per million tokens materially changes viability
  - the deployment already assumes hosted APIs and official compatibility with coding-agent tools reduces integration cost
- Open-model ecosystem-heavy families are strongest when:
  - sovereign or region-specific deployment matters
  - derivative variants and community fine-tunes are strategic assets, not noise
  - the team expects to mix smaller deployment-tier models with a few larger hosted reasoners
- Portfolio-style open-model families are strongest when:
  - one vendor offers a coherent ladder from small edge models to larger datacenter checkpoints
  - the same licensing and serving assumptions can cover both local fallback and central hosted clusters
  - platform teams want one model family policy instead of separate approvals for every deployment tier
- Compliance-routed hosted models are strongest when:
  - procurement depends on region-pinned inference
  - one platform must expose a model allowlist per residency boundary
  - paying a small routing premium is cheaper than building and operating an internal compliant stack
  - excluded models are acceptable if the remaining compliant set still covers the main workflows
- Certified hosted runtimes are strongest when:
  - the organization needs government or similarly regulated procurement evidence
  - the approved surface includes both the interaction mode and the programmable API path the workflow needs
  - platform teams want reusable authorization packages instead of restarting security review from zero for every agent use case
- Small and mid-sized open models deserve explicit routing priority when download and deployment signals show they are the real operational default, not just the benchmark undercard.
- BYOK-capable agent shells are strongest when:
  - the team wants one agent workflow across multiple providers
  - existing enterprise contracts already cover the preferred model vendor
  - security policy requires explicit network and telemetry boundaries
  - local and hosted models may be swapped without retraining the operator on a different tool surface
- Hosted long-context models are strongest when:
  - there is a concrete need to run repo-scale coding or cross-document synthesis experiments immediately
  - API availability and pricing make repeated routing tests cheap enough to operationalize
  - the operator workflow already depends on tools with official compatibility rather than custom glue
- Reasoning-preserving open coding models are strongest when:
  - iterative multi-file work must survive long sessions without losing prior problem framing
  - evaluation is based on repository task completion rather than isolated benchmark prompts
  - the model family also ships an agent surface that lowers terminal-workflow adoption friction
- Ultra-long-context low-cost open models are strongest when:
  - the dominant cost is repeated large-context ingestion rather than one-shot hard reasoning
  - workload segmentation can safely route ambiguous final judgment to a stronger secondary model
  - regional deployment or alternate hardware support is part of the procurement calculus
- Shared host routing surfaces are strongest when:
  - teams want one collaboration interface while varying model cost, latency, and reliability by task
  - repository owners can keep model choice inside the PR or issue workflow instead of jumping to vendor consoles
  - admins can govern which model families appear at all
- Shared host model selection is strongest when:
  - one collaboration surface can route routine tasks to cheaper models and ambiguous work to stronger ones
  - admins can enable only approved vendor families for the relevant repositories or organizations
  - the platform keeps model choice inside the existing PR, issue, or agent workflow instead of sending operators to separate vendor consoles
- Cloud-native frontier distribution is strongest when:
  - the organization already trusts the host cloud's IAM, billing, procurement, and audit layers
  - the coding agent or managed-agent surface can consume that same governance stack without separate SaaS onboarding
  - usage can count against existing cloud commitments or budget envelopes instead of opening a parallel spend channel
- Neither model class compensates for weak retrieval, stale source curation, or vague task framing.

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Agent Skill System Design]]
- [[Notion Source Of Truth]]
