# Workflow vs Capability Skills

Use this note when deciding what kind of reusable package to create.

## Why the split matters

Many weak skill packages try to do two jobs at once:

- sequence a multi-step workflow
- provide durable expertise or tool guidance

That usually makes the package harder to trigger, harder to maintain, and harder to port. Split the responsibilities early.

## Workflow skills

Workflow skills are best when the value is:

- a repeatable order of operations
- checkpoints, approvals, or review gates
- predictable outputs
- a clear start condition and end condition

Typical examples:

- repo onboarding
- release checklist generation
- migration planning
- QA pass and regression review

Good workflow skills usually define:

- trigger
- minimum inputs
- steps
- validation points
- expected output format

## Capability skills

Capability skills are best when the value is:

- durable knowledge
- tool uplift
- narrow technical judgment
- safe usage guidance for a specialized domain

Typical examples:

- writing Cloudflare Durable Objects safely
- reading a complex analytics schema
- using a deployment tool with the right constraints

Good capability skills usually define:

- when the expertise applies
- the key rules or heuristics
- common mistakes
- references for deeper detail

## Choose the smallest durable form

Use a prompt when:

- the process is still exploratory
- there is no stable trigger yet
- the next conversation will probably reshape it

Use a reference doc when:

- the value is durable knowledge
- the user needs a stable explanation more than a workflow

Use a script when:

- the execution is mechanical and stable
- the agent should stop typing the same commands by hand

Use a workflow skill when:

- the value is the sequence, checkpoints, and outputs

Use a capability skill when:

- the value is the judgment, knowledge, or tool discipline

## Quality bar

A reusable package should have:

- a clear trigger
- one primary job
- a minimal contract
- an obvious reason to exist more than once

If you cannot explain why the package will be reused, do not create it.

## Source Notes

- Officially verified: [Anthropic Claude Code slash commands and skills docs](https://code.claude.com/docs/en/slash-commands), [Agent Skills open standard](https://agentskills.io/home)
- Ecosystem inspiration: `oh-my-agent` workflow separation, practical public skill catalogs, and multi-agent quality gates
