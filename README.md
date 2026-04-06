# Agent Tips

An English-first hybrid toolkit for reusable agent assets.

This repository is intentionally small and curated. It packages practical patterns for turning one-off agent work into durable assets:

- public skills you can reuse across repositories
- reference docs that explain portable design choices
- prompts that steer a session toward reusable outputs
- lightweight validation for keeping the catalog tidy
- a local design-wiki prototype for Notion-first, compiled project design reasoning

## Start Here

- Read [quick-prompt.md](quick-prompt.md) if you want a strong kickoff prompt for building something real while leaving behind reusable assets.
- Read [repo-onboarding](skills/public/repo-onboarding/SKILL.md) if you need to understand an unfamiliar repository and spot reusable workflows.
- Read [repo-skill-builder](skills/public/repo-skill-builder/SKILL.md) if you want to package a repository-specific workflow into a reusable skill.
- Read [design-wiki-engine](references/design-wiki-engine.md) if you want the local Notion-first project design advisor prototype.
- Run `bash scripts/validate-skills.sh` before publishing changes to this repo.

## Repository Contract

- `skills/public/*` contains directly reusable public skills.
- `references/*` contains durable pattern docs and comparison notes.
- `scripts/*` contains lightweight validation or support tooling for this repository.
- `quick-prompt.md` is the opinionated "start here" prompt for turning active work into reusable agent assets.

This repo is not a trend archive. It keeps only patterns that are clear enough to reuse.

## Public Skills

<!-- SKILL_INDEX_START -->
- [`agent-harness-builder`](skills/public/agent-harness-builder/SKILL.md) designs an agent-friendly harness around an existing tool, repo, or process.
- [`repo-onboarding`](skills/public/repo-onboarding/SKILL.md) maps an unfamiliar repository and extracts reusable workflows, harness seams, and quality gates.
- [`repo-skill-builder`](skills/public/repo-skill-builder/SKILL.md) turns repository-specific work into a standard-compliant skill package.
- [`workflow-skill-designer`](skills/public/workflow-skill-designer/SKILL.md) turns a messy repeated process into a reusable workflow skill.
<!-- SKILL_INDEX_END -->

## Reference Docs

- [workflow-vs-capability-skills](references/workflow-vs-capability-skills.md)
- [agent-skills-open-standard](references/agent-skills-open-standard.md)
- [agent-harness-patterns](references/agent-harness-patterns.md)
- [design-wiki-engine](references/design-wiki-engine.md)
- [tooling-differences](references/tooling-differences.md)

## Design Wiki Prototype

This repo now includes a small local prototype for a Notion-first compiled design wiki:

- local engine: `src/design-wiki/`
- Notion source registry seed: `raw/notion/`
- compiled retrieval pages: `wiki/`
- Obsidian thin wrapper: `obsidian-plugin/design-wiki-thin-wrapper/`
- tests: `tests/design-wiki/`

The intended operating model is:

- write and curate source material in Notion
- record source pages under `raw/notion/`
- compile reusable decision pages into `wiki/`
- let the engine answer only from the compiled local wiki

Obsidian is optional. The thin wrapper exists if you want an editor UI later, but the core engine works from any Markdown workspace.

Run:

```bash
npm test
npm run start:design-wiki
npm run start:design-wiki:ollama
npm run start:design-wiki:web
npm run start:design-wiki:web:ollama
```

For remote browser access on your local network, set a shared token before using a web script:

```bash
export DESIGN_WIKI_AUTH_TOKEN="choose-a-long-random-token"
npm run start:design-wiki:web:ollama
```

Then open `http://<your-mac-ip>:43121/` in a browser and enter the same token in the page.

## Validation

Run:

```bash
bash scripts/validate-skills.sh
```

The validator checks:

- every public skill has minimal frontmatter
- local Markdown links resolve
- the README skill index matches the actual public skill catalog

## Design Stance

- Open-standard concepts come first.
- Tool-specific behavior belongs in notes and comparisons, not in the core contract.
- Workflow skills and capability skills solve different problems and should stay distinct.
- A reusable asset package is usually more useful than a long chat transcript.
