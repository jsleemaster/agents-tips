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

## Gemma 4 Signal

- Gemma 4 is notable because it frames small open models as agent-ready runtimes rather than toy local models.
- The E2B and E4B line is especially relevant for laptop-class deployment.
- The strongest design implication is that local structured-output agents are now practical enough for product workflows, not only demos.

## Qwen 3.6 Signal

- Qwen 3.6 pushes the opposite frontier: long context, stronger coding performance, and aggressive price/performance in API form.
- The practical takeaway is that a cheap hosted reasoning layer may beat a purely local stack when the workload needs deeper synthesis across large corpora.

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

## Current Recommendation

- Keep `gemma4:e4b` as the default local answer-shaping runtime.
- Treat larger or hosted models as optional final reasoners, not mandatory defaults.
- Improve the wiki and retrieval layer before blaming the model for weak answers.

## What To Add From Future Notion Links

- benchmark claims only when they affect an actual design decision
- deployment constraints
- pricing thresholds
- latency or memory implications
- product fit: local runtime, hosted API, or hybrid

## Related Pages

- [[Claude Code Operating Patterns]]
- [[Agent Skill System Design]]
- [[Notion Source Of Truth]]
