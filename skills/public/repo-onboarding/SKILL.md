---
name: repo-onboarding
description: "Rapidly understand and operate any codebase. Use when Codex needs to onboard to an unfamiliar repo: identify entry points, build/test commands, architecture, data flow, and risk areas; generate concise summaries and action plans for cleanup, refactors, bug fixes, or feature work."
---

# Repo Onboarding

Follow this workflow to get productive quickly in any repository without overloading context.

## 1) Establish the repo shape

- List the top-level structure and identify obvious entry points.
- Detect the primary language and framework by scanning for standard files (package.json, pyproject.toml, Cargo.toml, go.mod, etc.).
- Identify documentation: README, docs/, ADRs, CONTRIBUTING, runbooks.

Suggested commands:

- `ls`
- `rg --files -g 'README*' -g 'docs/**' -g 'CONTRIBUTING*'`
- `rg --files -g 'package.json' -g 'pyproject.toml' -g 'requirements*.txt' -g 'Cargo.toml' -g 'go.mod' -g 'Gemfile'`

## 2) Determine how to run and test

- Locate scripts or make targets (package.json scripts, Makefile, Taskfile, tox, npm, etc.).
- Extract the minimal run/test commands.
- Note environment prerequisites (DBs, services, env vars).

Suggested commands:

- `rg --files -g 'Makefile' -g 'Taskfile.yml' -g 'tox.ini' -g 'package.json'`
- `rg -n "(scripts|test|dev|start|build)" package.json Makefile Taskfile.yml`

## 3) Map core architecture and data flow

- Identify the app entry point(s): main module, server bootstrap, CLI entry.
- Find routes/handlers, services, and data access layers.
- Trace key execution flows for the requested feature/bug.

Suggested commands:

- `rg -n "(main|bootstrap|app\.)" src/`
- `rg -n "(router|routes|controller|handler)" src/`
- `rg -n "(repository|dao|model|schema|migration)" src/`

## 4) Identify risk and change hotspots

- Locate recently changed files or large modules.
- Identify dependencies, external APIs, or shared libraries.
- Flag areas likely to require tests or migrations.

Suggested commands:

- `git status -sb`
- `git log --oneline -n 20`
- `rg -n "TODO|FIXME|HACK"`

## 5) Produce a concise onboarding summary

Deliver a short, actionable output. Keep it under ~15 bullets:

- **Project type + runtime**
- **How to run**
- **How to test**
- **Key entry points**
- **Core modules**
- **Data stores + migrations**
- **External services**
- **Primary risks**
- **Next steps** (for the user’s task)

## 6) If asked to implement work

- Propose a small plan with 2–5 steps.
- Implement minimal, targeted changes.
- Add tests if a reasonable seam exists.
- Re-run the smallest relevant test command.

## Output template

Use this template when summarizing:

- Project type/runtime:
- Run:
- Test:
- Entry points:
- Core modules:
- Data stores:
- External services:
- Risks/unknowns:
- Next steps:
