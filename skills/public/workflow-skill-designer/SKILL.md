---
name: workflow-skill-designer
description: "Design a reusable workflow skill from a messy repeated process. Use when a user has a recurring task and you need to decide whether it should stay a prompt, become a skill package, or be split across references and scripts."
---

# Workflow Skill Designer

Turn a repeated process into a reusable workflow skill without over-packaging it.

Reference docs:

- [workflow-vs-capability-skills](../../../references/workflow-vs-capability-skills.md)
- [agent-skills-open-standard](../../../references/agent-skills-open-standard.md)
- [tooling-differences](../../../references/tooling-differences.md)

## 1) Capture the repeated process

- Ask what keeps happening more than once.
- Extract the trigger, expected output, checkpoints, and common failure modes.
- Strip away one-off context that does not belong in a reusable package.

## 2) Decide the smallest durable form

Choose one:

- keep it as a prompt if the process is still exploratory
- write a reference doc if the value is mostly durable knowledge
- add a script if the execution is mechanical and stable
- create a workflow skill if the value is repeatable sequencing, judgment, and outputs

Do not create a skill just because the process is interesting.

## 3) Define the workflow contract

- Define when the skill should trigger.
- Define the minimum inputs required.
- Define the expected outputs and format.
- Define the checkpoints, review gates, and validation steps.
- Decide which details belong in `SKILL.md` versus `references/` or `scripts/`.

## 4) Keep workflow and capability separate

- Keep workflow logic in this package.
- Push durable background knowledge into references.
- If deep expertise dominates the package, it may actually be a capability skill instead.

## 5) Add evaluation criteria

- Define what success looks like.
- Add one or two failure examples so the package does not silently drift.
- Prefer a small explicit acceptance check over a vague "be thorough" instruction.

## 6) Output checklist

- [ ] repeated workflow identified
- [ ] prompt vs reference vs script vs skill decision made
- [ ] trigger, inputs, outputs, and checkpoints defined
- [ ] quality gates included where they matter
- [ ] references and scripts separated from the core workflow when helpful
- [ ] package is portable enough to explain outside one vendor runtime
