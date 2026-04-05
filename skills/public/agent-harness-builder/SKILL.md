---
name: agent-harness-builder
description: "Design an agent-friendly harness for an existing repo, tool, or process. Use when you need a narrow execution surface with clear inputs, outputs, validation, and packaging into skill, references, and scripts."
---

# Agent Harness Builder

Turn an existing repo, tool, or process into a narrow interface that an agent can use safely and repeatedly.

Reference docs:

- [agent-harness-patterns](../../../references/agent-harness-patterns.md)
- [agent-skills-open-standard](../../../references/agent-skills-open-standard.md)
- [tooling-differences](../../../references/tooling-differences.md)

## 1) Find the leverage surface

- Identify the smallest real interface that already works:
  - CLI command
  - script
  - make target
  - test command
  - stable entrypoint inside an existing repo
- Prefer wrapping real software behavior, not a toy imitation.

## 2) Decide whether a harness is justified

Build a harness only if:

- the interface is stable enough to call repeatedly
- inputs can be constrained
- outputs can be made legible
- validation boundaries are clear

If the process is still unstable, stop at a reference doc or workflow skill instead.

## 3) Design the execution contract

- Define the command shape.
- Define required inputs and optional inputs.
- Define output shape: text, JSON, files, or artifacts.
- Define state assumptions: working directory, files, env vars, services.
- Define obvious errors and what they should look like.

## 4) Package the harness

- Put behavior and usage rules in `SKILL.md`.
- Put deeper operational notes in `references/`.
- Put repeatable command logic in `scripts/`.
- Add `assets/` only if templates or fixtures materially reduce error.

## 5) Add validation boundaries

- Define the smallest check that proves the harness still works.
- Prefer smoke tests and contract validation over broad "works in general" claims.
- Call out unsafe side effects explicitly.

## 6) Output checklist

- [ ] narrow execution surface chosen
- [ ] command inputs and outputs defined
- [ ] state and side effects documented
- [ ] packaging split across skill, references, scripts, and assets is justified
- [ ] validation command or smoke check defined
- [ ] design reflects real software behavior, not a fake wrapper
