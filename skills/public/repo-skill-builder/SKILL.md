---
name: repo-skill-builder
description: "Generate a new Codex skill tailored to a specific repository. Use when Codex should read a repo, infer repeatable workflows, and author SKILL.md plus supporting scripts/references/assets; include guidance for using context-aware MCP tools (e.g., contextmcp7) to load repo context efficiently."
---

# Repo Skill Builder

Create a reusable skill that is specific to the target repository and task domain.

## 1) Discover the repo and its workflows

- Identify the primary language, framework, and execution model.
- Find repeatable tasks the user will ask for (feature work, fixes, reporting, migrations, ops).
- Map where domain knowledge lives (docs, schemas, runbooks, ADRs).

Suggested commands:

- `ls`
- `rg --files -g 'README*' -g 'docs/**' -g 'CONTRIBUTING*'`
- `rg --files -g 'package.json' -g 'pyproject.toml' -g 'requirements*.txt' -g 'Cargo.toml' -g 'go.mod'`

## 2) Capture reusable assets

- **Scripts**: add scripts for repetitive, error-prone steps (build, test, migrations, data export).
- **References**: store domain docs (schemas, APIs, runbooks) in `references/`.
- **Assets**: store templates, boilerplate, or sample configs in `assets/`.

Keep SKILL.md short; move details to references.

## 3) Use context-aware MCP tools to load repo context

- Prefer context MCP tools (e.g., `contextmcp7`) to fetch only the minimal repo context needed.
- Load files by intent: start with entry points and docs, then pull specific modules as needed.
- Avoid bulk-loading entire trees; use targeted queries and file fetches.

## 4) Author the skill

- Write concise frontmatter: name + description with clear triggers.
- Use imperative steps and include a minimal, repeatable workflow.
- Link to references and scripts instead of embedding large content.

## 5) Output checklist

- [ ] SKILL.md created with clear trigger description
- [ ] scripts/ added for repetitive steps (if needed)
- [ ] references/ added for domain knowledge (if needed)
- [ ] assets/ added for reusable templates (if needed)
- [ ] Notes on how to use context MCP tools to load repo context
