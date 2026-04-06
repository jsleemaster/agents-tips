# Design Wiki Engine

This reference describes the local design wiki engine prototype that turns an Obsidian vault into a closed-world project design advisor.

## What it does

- indexes Markdown pages under `wiki/`
- accepts design questions through a local API
- returns opinionated answers grounded in citations
- logs every question under `derived/query-log/`
- auto-applies low-risk updates such as related-question appends
- creates review drafts for bigger knowledge gaps under `derived/draft-updates/`
- promotes approved drafts into canonical `wiki/` pages

## Vault layout

The engine creates these directories automatically inside the target vault root:

- `raw/`
- `wiki/`
- `derived/query-log/`
- `derived/draft-updates/`
- `derived/ingest-summaries/`
- `state/`

## Local API

- `POST /query`
- `POST /ingest`
- `POST /review-updates`
- `POST /promote`

`POST /query` returns:

- `answer`
- `recommendation`
- `alternatives`
- `citations`
- `confidence`
- `missing_knowledge`
- `auto_updates_applied`
- `draft_updates_created`

## Model adapter seam

The engine separates retrieval/state management from final answer shaping.

### Heuristic adapter

Default mode. Useful for tests and for bringing up the system without a model runtime.

### Command adapter

Use `CommandModelAdapter` when you want to shell out to a local model runner such as a Gemma CLI wrapper.

Contract:

- stdin: one JSON object containing `question`, `citations`, `missingKnowledge`, and `suggestedConfidence`
- stdout: one JSON object with `answer`, `recommendation`, `alternatives`, and optional `confidence`
- non-zero exit: request fails

This keeps the engine model-independent while still making local open-model integration straightforward.

## Obsidian wrapper

The thin wrapper lives in [obsidian-plugin/design-wiki-thin-wrapper](../obsidian-plugin/design-wiki-thin-wrapper/README.md).

It exposes three commands:

- `Ask Design Wiki`
- `Review Suggested Updates`
- `Promote Draft Insight`
