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

## Qwen 3.6 Signal

- Qwen 3.6 pushes the opposite frontier: long context, stronger coding performance, and aggressive price/performance in API form.
- Source notes claim a 1M-token context window, multimodal support, and repo-scale coding workflows.
- Source notes also position it as practical for design-to-code and full-repository coding lanes, not only text-heavy question answering.
- The practical takeaway is that a cheap hosted reasoning layer may beat a purely local stack when the workload needs deeper synthesis across large corpora.
- The important signal is not just price, but the combination of very long context and coding-agent compatibility.
- Official compatibility with agent shells such as Claude Code, Cline, and OpenClaw is a deployment signal: ecosystem fit can matter as much as raw benchmark wins when the real question is adoption friction.
- DeepSeek-V4 adds a more specific runtime test for open frontier models: a 1M-token claim only matters if FLOPs, KV cache pressure, and prefill cost stay low enough that a long agent session remains affordable.
- Tool-call schema stability and reasoning-trace persistence are runtime signals, not trivia: if a model cannot preserve structured calls or multi-turn reasoning across tool loops, the headline context window is less meaningful.

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
- Prefer runtimes with native webhooks, retry semantics, and idempotent completion events when the workload includes long-running batch, research, or generation jobs; polling-heavy APIs create orchestration debt even when the base model is strong.
- For multi-agent or long-lived sessions, compare runtimes on cache hit rate, compaction behavior, and token-per-task economics, not just price per million tokens.
- For agent workloads with repeated long prefixes, compare distributed KV cache design, prefix reuse, and cross-instance session routing before trusting raw token/sec claims; serving architecture can dominate model quality once sessions span dozens of turns.
- If a coding agent product suddenly degrades, check runtime defaults before swapping models: reasoning-effort changes, stale-session retention bugs, compaction policy, and prompt-layer edits can produce larger regressions than the underlying API model.
- Prefer realtime runtimes when the product is voice-first and needs session memory, interruption recovery, parallel tool calls, and live translation inside one loop rather than as separate stitched services.

## Current Recommendation

- Keep `gemma4:e4b` as the default local answer-shaping runtime.
- Treat larger or hosted models as optional final reasoners, not mandatory defaults.
- Improve the wiki and retrieval layer before blaming the model for weak answers.
- Treat a long-context hosted model as the fallback for codebase-wide synthesis, benchmark-sensitive coding tasks, or cases where chunking would distort the answer.
- Prefer Gemma 4 MTP drafter support when local latency is the blocker for chat, voice, coding-assistant, or multi-step agent loops; it is less relevant when retrieval quality or reasoning depth is the limiting factor.

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
- Qwen-style hosted runtimes are strongest when:
  - context length is the primary bottleneck
  - coding-agent workflows need broader synthesis
  - price per million tokens materially changes viability
  - the provider can sustain long sessions without severe peak-time throttling
- Workflow-oriented hosted runtimes are strongest when:
  - long-running jobs should complete by callback rather than polling
  - retries, event logging, and orchestration reliability matter as much as answer quality
  - the provider already behaves like a workflow runtime instead of a raw inference endpoint
- Realtime voice runtimes are strongest when:
  - voice is the primary action surface rather than a thin UI layer
  - session context, tool transparency, and multilingual turn-taking must stay inside one runtime
  - pricing and latency must be evaluated in audio-token or per-minute terms, not only text-token terms
- Agent runtime choice should include inference-engineering signals such as prompt caching, cache locality, speculative decoding, compaction frequency, and sub-agent fan-out cost.
- Long-session serving stacks are strongest when they preserve session stickiness, keep distributed cache hit rate high, and reduce TTFT for reused prefixes; otherwise a nominally strong model can still lose on agent turnaround time.
- Treat the runtime as model plus serving layer plus prompt policy; context-window headlines are weaker evidence than stable tool-call schemas and reasoning-state retention across long tool loops.
- Neither model class compensates for weak retrieval, stale source curation, or vague task framing.

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Agent Skill System Design]]
- [[Notion Source Of Truth]]
