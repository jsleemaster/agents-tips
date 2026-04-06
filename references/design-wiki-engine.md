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

### Ollama adapter

Use `OllamaModelAdapter` when you want the engine to call a local Ollama server directly.

Default settings:

- model: `gemma4:e4b`
- base URL: `http://127.0.0.1:11434`
- think: `low`

Environment variables:

- `DESIGN_WIKI_MODEL_BACKEND=ollama`
- `DESIGN_WIKI_OLLAMA_MODEL=gemma4:e4b`
- `DESIGN_WIKI_OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `DESIGN_WIKI_OLLAMA_THINK=low`
- `DESIGN_WIKI_OLLAMA_KEEP_ALIVE=5m`

Quick start:

```bash
ollama serve
ollama pull gemma4:e4b
cd /path/to/your/wiki-vault
npm --prefix /Users/smlee/agent-tips run start:design-wiki:ollama
```

The adapter sends the wiki evidence to Ollama with a closed-world system prompt and expects JSON output back.

## Obsidian wrapper

The thin wrapper lives in [obsidian-plugin/design-wiki-thin-wrapper](../obsidian-plugin/design-wiki-thin-wrapper/README.md).

It exposes three commands:

- `Ask Design Wiki`
- `Review Suggested Updates`
- `Promote Draft Insight`
