# Agent Skills Open Standard

This note captures the portable core that shows up across public skill ecosystems.

## Portable package model

A practical skill package usually consists of:

- `SKILL.md` as the entrypoint
- optional `references/` for deeper knowledge
- optional `scripts/` for repeatable execution
- optional `assets/` for templates, samples, or fixtures

That package shape is more reusable than a single oversized instruction file.

## Minimal portable contract

The most reliable cross-tool assumptions are small:

- a skill has a name
- a skill has a short description
- the body explains when to use it and how to proceed
- supporting files are linked explicitly

Avoid assuming that every runtime supports the same metadata keys, hook system, or dispatch model.

## What is officially verified

These ideas are grounded in primary sources:

- Claude Code supports skill discovery and frontmatter-based skill files.
- The Agent Skills ecosystem treats `SKILL.md` as the package entrypoint and encourages supporting references, scripts, and assets.
- Portable packaging is stronger than relying on a chat transcript or opaque product UI.

## What belongs in notes, not in the core contract

These may be useful but should not be presented as universal:

- vendor-only metadata keys
- product-specific hook syntax
- proprietary policy controls
- IDE-specific discovery rules
- unverified claims from blog posts or secondary articles

## Portability rules

- Keep the core package human-readable.
- Keep local file links explicit.
- Put tooling differences in a comparison note.
- Describe required runtime features instead of implying they exist everywhere.

## Source Notes

- Officially verified: [Anthropic Claude Code slash commands and skills docs](https://code.claude.com/docs/en/slash-commands), [Agent Skills open standard](https://agentskills.io/home)
- Inspired by ecosystem direction, not treated as universal fact: GitHub Copilot agent-skill packaging, public skill repos, and community workflow patterns
