# Agent Harness Patterns

Use this note when deciding how to expose an existing tool, repo, or process to an agent through a narrow execution surface.

## What a harness is

A harness is a small, explicit interface around real software behavior. It lets an agent operate through:

- a command
- a script
- a make target
- a stable entrypoint

The goal is not to hide the real system. The goal is to make the real system easier to call safely and repeatedly.

## Good harness properties

- narrow inputs
- legible outputs
- explicit state assumptions
- small validation checks
- documented side effects

If any of those are missing, the harness will drift into a brittle wrapper.

## A practical contract

Define these things explicitly:

- command name
- working directory assumptions
- required files or environment variables
- output format
- error format
- destructive actions, if any
- smoke check or validation command

Prefer text or JSON outputs over implicit success.

## Packaging pattern

Split responsibilities cleanly:

- `SKILL.md` explains when and how to use the harness
- `references/` explains deeper operational detail
- `scripts/` holds repeatable command logic
- `assets/` holds templates or fixtures only if they lower error rate

## Quality gates

Useful harnesses usually include one or more of:

- smoke test
- contract validation
- fixture-based dry run
- output schema check
- side-effect warning before destructive paths

## Anti-patterns

- wrapping an unstable process too early
- inventing a fake CLI instead of using the real entrypoint
- hiding required state from the user
- returning unstructured output with no validation seam
- creating a giant framework when a small script would do

## Source Notes

- Officially verified: [Agent Skills open standard](https://agentskills.io/home)
- Ecosystem inspiration: [CLI-Anything](https://github.com/HKUDS/CLI-Anything), public agent harness repos, and the direction toward repository-packaged agent assets
