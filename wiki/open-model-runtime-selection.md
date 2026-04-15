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
- Native support for function calling, structured JSON output, and system instructions matters more than raw benchmark rank when the target workload is an agent loop.
- Vision and video support widen the cases where a local runtime can stay in the loop instead of escalating immediately to a hosted multimodal model.
- Native audio input on the E2B and E4B line matters because it pushes the smallest deployments closer to complete on-device agent surfaces instead of text-only assistants.
- Google is explicitly positioning the 31B model as a top-tier open model and the 26B model as a smaller but still competitive open option; the important retrieval takeaway is not the leaderboard claim itself, but that agent-ready structured output is now bundled with serious open-model ambition.
- The strongest design implication is that local structured-output agents are now practical enough for product workflows, not only demos.

## Qwen 3.6 Signal

- Qwen 3.6 pushes the opposite frontier: long context, stronger coding performance, and aggressive price/performance in API form.
- Source notes claim a 1M-token context window, multimodal support, and repo-scale coding workflows.
- The price signal is large enough to matter as policy, not trivia: roughly `$0.29` per 1M input tokens versus premium-model pricing an order of magnitude higher.
- Official compatibility with coding-agent surfaces such as Claude Code, Cline, and OpenClaw increases deployment fit for existing agent workflows.
- Immediate availability through Alibaba Cloud Model Studio and Bailian matters because it lowers the cost of running a real routing experiment instead of treating Qwen as a hypothetical future option.
- The practical takeaway is that a cheap hosted reasoning layer may beat a purely local stack when the workload needs deeper synthesis across large corpora.
- The important signal is not just price, but the combination of very long context and coding-agent compatibility.

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

## Routing Thresholds

- Prefer the local default when the answer can be assembled from a few wiki pages plus short supporting excerpts.
- Escalate when context management itself becomes the problem:
  - a large repository must be reasoned over as one unit
  - the source set is too broad to chunk safely
  - the question depends on reconciling many competing signals at once
- Escalate when multimodal evidence or full-repository coding flows would be materially weakened by local model limits.
- Do not escalate just because a benchmark looks better; escalate when the workload shape actually matches the benchmark advantage.
- Do not treat "1M context" as sufficient by itself; it only changes routing policy when the rest of the agent shell can actually preserve tool use, streaming, and stable repo-scale execution under that larger window.
- Do not choose a hosted runtime if the environment requires an explicit no-fallback guarantee; if silent fallback to a vendor-hosted model would violate policy, the runtime must expose a hard offline mode instead of a best-effort preference.
- For coding-agent shells, treat these capability gates as minimum viability checks before a runtime becomes the shared default:
  - tool calling
  - streaming
  - roughly `128k` context or better
  - consistent behavior across subagents that inherit the same provider configuration

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

## What To Add From Future Notion Links

- benchmark claims only when they affect an actual design decision
- deployment constraints
- pricing thresholds
- latency or memory implications
- product fit: local runtime, hosted API, or hybrid

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
- BYOK-capable agent shells are strongest when:
  - the team wants one agent workflow across multiple providers
  - existing enterprise contracts already cover the preferred model vendor
  - security policy requires explicit network and telemetry boundaries
  - local and hosted models may be swapped without retraining the operator on a different tool surface
- Hosted long-context models are strongest when:
  - there is a concrete need to run repo-scale coding or cross-document synthesis experiments immediately
  - API availability and pricing make repeated routing tests cheap enough to operationalize
  - the operator workflow already depends on tools with official compatibility rather than custom glue
- Neither model class compensates for weak retrieval, stale source curation, or vague task framing.

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Agent Skill System Design]]
- [[Notion Source Of Truth]]
