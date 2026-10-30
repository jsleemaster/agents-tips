# AGENTS.md

This file is the shared contract for Codex, Claude Code, and other coding agents working in this repository.

## Project

Agent Tips is a small, curated, English-first toolkit of reusable agent assets. It is not a trend archive; keep only patterns that are clear enough to reuse.

- `skills/public/*`: directly reusable public skills, each with `SKILL.md`
- `references/*`: durable pattern docs and comparison notes
- `scripts/*`: lightweight validation and support tooling
- `src/design-wiki/`, `tests/design-wiki/`: local Notion-first design-wiki prototype
- `quick-prompt.md`: the opinionated kickoff prompt

## Commands

```bash
bash scripts/validate-skills.sh   # frontmatter, local links, README skill index
npm test                          # design-wiki tests
npm run start:design-wiki
```

## Rules

- Run `bash scripts/validate-skills.sh` before every commit; add a new public skill to the README skill index in the same change.
- Open-standard concepts come first. Tool-specific behavior belongs in notes and comparisons such as `references/tooling-differences.md`, not in a skill's core contract.
- Keep workflow skills and capability skills distinct.
- Write public assets in English.
