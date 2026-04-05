---
name: repo-skill-builder
description: "Create a repository-specific skill package. Use when you need to turn repeated repo work into a portable, standard-compliant package built from SKILL.md plus optional references, scripts, assets, and validation."
---

# Repo Skill Builder

Create a reusable skill package that is specific to the target repository and task domain.

Anchor the package around a standard shape:

- `SKILL.md`
- optional `references/`
- optional `scripts/`
- optional `assets/`
- optional validation hooks or checks

Reference docs:

- [workflow-vs-capability-skills](../../../references/workflow-vs-capability-skills.md)
- [agent-skills-open-standard](../../../references/agent-skills-open-standard.md)
- [agent-harness-patterns](../../../references/agent-harness-patterns.md)
- [tooling-differences](../../../references/tooling-differences.md)

## 1) Discover the repo and its workflows

- Identify the primary language, framework, and execution model.
- Find repeatable tasks the user will ask for (feature work, fixes, reporting, migrations, ops).
- Map where domain knowledge lives (docs, schemas, runbooks, ADRs).
- Identify the safest validation seam that can prove the skill works.

Suggested commands:

- `ls`
- `rg --files -g 'README*' -g 'docs/**' -g 'CONTRIBUTING*'`
- `rg --files -g 'package.json' -g 'pyproject.toml' -g 'requirements*.txt' -g 'Cargo.toml' -g 'go.mod'`

## 2) Classify the skill before writing it

Decide whether the package is mainly a:

- **workflow skill** for a repeatable multi-step process, or
- **capability skill** for durable knowledge, tool uplift, or narrow expertise

Do not blur both into one package unless the boundary is truly small and obvious.

Use:

- workflow skill when the value is order, checkpoints, and outputs
- capability skill when the value is domain guidance, heuristics, or safe tool usage

## 3) Capture reusable assets

- **Scripts**: add scripts for repetitive, error-prone steps (build, test, migrations, data export).
- **References**: store domain docs (schemas, APIs, runbooks) in `references/`.
- **Assets**: store templates, boilerplate, or sample configs in `assets/`.
- **Validation**: define the smallest command or check that proves the package still works.

Keep SKILL.md short; move details to references.

## 4) Use context-aware tools to load repo context

- Prefer context-aware repo tools when available to fetch only the minimal context needed.
- Load files by intent: start with entry points and docs, then pull specific modules as needed.
- Avoid bulk-loading entire trees; use targeted queries and file fetches.

## 5) Author the package

- Write concise frontmatter: `name` and `description` are required.
- Give the package one clear trigger and one primary job.
- Keep the portable core in `SKILL.md`.
- Push tool-specific notes, caveats, and longer examples into `references/`.
- Link to scripts instead of embedding long command sequences when a script is justified.
- Avoid unsupported vendor-specific fields unless the target tool officially documents them.

## 6) Keep it portable

- Prefer generic concepts such as inputs, outputs, validation, and quality gates over vendor-only jargon.
- If the package depends on one tool, say so explicitly in notes instead of pretending the behavior is universal.
- Separate:
  - **portable contract** in the skill
  - **tooling differences** in references

## 7) Output checklist

- [ ] SKILL.md created with clear trigger description
- [ ] skill is classified as workflow or capability
- [ ] public trigger is clear and non-overlapping with nearby skills
- [ ] scripts/ added for repetitive execution (if needed)
- [ ] references/ added for durable knowledge and tool notes (if needed)
- [ ] assets/ added for reusable templates (if needed)
- [ ] smallest useful validation check is defined
- [ ] tool-specific behavior is isolated into notes, not core claims
- [ ] unsupported vendor syntax is not presented as universal
