---
title: Notion Source Of Truth
aliases:
  - Notion Sync Policy
  - Notion First Workflow
tags:
  - notion
  - source-of-truth
  - workflow
---

# Notion Source Of Truth

The intended operating model is:

- Notion is the human writing surface.
- The local wiki is a compiled retrieval layer.
- The engine answers from `wiki/`, not directly from raw Notion pages at query time.

## Why This Split Works

- Notion is better for collection, curation, and long-form editing.
- The local wiki is better for stable retrieval, link structure, and closed-world answering.
- This keeps the answer engine grounded while still letting the human source evolve in Notion.

## Source Pages In Scope

- `🔗 링크 정리` is the ongoing archive of AI links, tools, models, and trend signals.
- `Claude Code 팁 (2026) - Agent Optimized` is the compact operator note.
- `Claude Code in Action 과정 + 최신 팁 종합 정리` is the long-form operational handbook.

## Compilation Rules

- Treat Notion pages as raw source, not final retrieval pages.
- Compress repeated details into reusable decision pages.
- Preserve source URLs inside raw notes or citations.
- Prefer updating an existing page over creating a new top-level page.
- If a new Notion page changes a major recommendation, update the canonical wiki page and mention the shift explicitly.

## Promotion Pattern

- Raw Notion page arrives.
- Distill the decision points, recurring principles, and tradeoffs.
- Merge the distilled result into pages like [[Claude Code Operating Patterns]], [[Agent Skill System Design]], or [[Open Model Runtime Selection]].
- Only create a new page when the material introduces a clearly new decision area.

## Weakness To Watch

- If the wiki only mirrors article summaries, retrieval quality drops.
- If the wiki becomes too generic, the engine answers with vague advice.
- The best wiki pages capture decisions, thresholds, exclusions, and example scenarios.
