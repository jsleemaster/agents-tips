# Design Wiki Engine

This reference describes the local design wiki engine prototype that turns a local Markdown workspace into a closed-world project design advisor.

The recommended operating model is Notion-first:

- Notion is the human editing and collection surface.
- `raw/notion/` records which Notion pages seeded the local corpus.
- `wiki/` stores compiled, retrieval-friendly decision pages.
- The engine answers from `wiki/`, not from raw Notion pages at query time.

## What it does

- indexes Markdown pages under `wiki/`
- accepts design questions through a local API
- returns opinionated answers grounded in citations
- logs every question under `derived/query-log/`
- auto-applies low-risk updates such as related-question appends
- creates review drafts for bigger knowledge gaps under `derived/draft-updates/`
- promotes approved drafts into canonical `wiki/` pages

## Workspace Layout

The engine creates these directories automatically inside the target workspace root:

- `raw/`
- `wiki/`
- `derived/query-log/`
- `derived/draft-updates/`
- `derived/ingest-summaries/`
- `state/`

## Typical Notion Workflow

1. Add or update source material in Notion.
2. Record the source page or database in `raw/notion/`.
3. Distill the decision points into one or more `wiki/` pages.
4. Query the engine against the compiled wiki.
5. Let low-risk updates land automatically and review larger draft insights before promotion.

This keeps the retrieval layer stable even as the Notion source corpus grows.

## Local API

The engine also serves a private browser UI:

- `GET /`
- `GET /app`
- `GET /health`

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
cd /path/to/your/wiki-workspace
npm --prefix /Users/smlee/agent-tips run start:design-wiki:ollama
```

The adapter sends the wiki evidence to Ollama with a closed-world system prompt and expects JSON output back.

## Private Web UI

The same process can serve a lightweight browser UI for phone or tablet access.

Local-only example:

```bash
cd /path/to/your/wiki-workspace
npm --prefix /Users/smlee/agent-tips run start:design-wiki:ollama
```

Open:

- `http://127.0.0.1:43121/`

Remote-on-LAN example:

```bash
export DESIGN_WIKI_HOST=0.0.0.0
export DESIGN_WIKI_AUTH_TOKEN="choose-a-long-random-token"
cd /path/to/your/wiki-workspace
npm --prefix /Users/smlee/agent-tips run start:design-wiki:web:ollama
```

Then open:

- `http://<your-mac-ip>:43121/`

Recommended environment variables:

- `DESIGN_WIKI_HOST=127.0.0.1` for local-only
- `DESIGN_WIKI_HOST=0.0.0.0` for LAN access
- `DESIGN_WIKI_AUTH_TOKEN=<shared secret>` for remote browser use

Notes:

- `GET /health` returns a small JSON health payload.
- When a shared token is set, API routes require `x-design-wiki-token` or `Authorization: Bearer ...`.
- The browser UI stores the token in local storage on that device for convenience.

## Obsidian wrapper

The thin wrapper lives in [obsidian-plugin/design-wiki-thin-wrapper](../obsidian-plugin/design-wiki-thin-wrapper/README.md).

It is optional. The core engine does not require Obsidian and can be used directly from a plain Markdown workspace or any custom UI.

It exposes three commands:

- `Ask Design Wiki`
- `Review Suggested Updates`
- `Promote Draft Insight`
