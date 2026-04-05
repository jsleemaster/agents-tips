# Tooling Differences

Portable patterns are more durable than tool-specific mechanics, but the differences still matter.

## Comparison Table

| Concept | Open-standard view | Anthropic Claude Code | GitHub Copilot direction | Practical guidance |
| --- | --- | --- | --- | --- |
| Skill/package entrypoint | `SKILL.md` plus supporting files | Skill files with frontmatter and slash-command integration | Agent and skill files inside the repo or user profile | Keep the package human-readable and file-based |
| Supporting docs | `references/`, `scripts/`, `assets/` are natural package pieces | Works well as linked local files | Same general idea, but product UX differs | Put durable knowledge outside the core instruction file |
| Metadata | Minimal contract is safest | Some metadata is officially supported | Product-specific metadata continues to evolve | Use only verified metadata in the core package |
| Discovery | Tool-specific | Built-in skill discovery and command invocation | Product-managed discovery and policy layers | Write triggers clearly so discovery can stay simple |
| Governance | Not part of the base standard | Tool permissions and runtime behavior vary | Enterprise allowlists and policy controls are product-level features | Keep governance notes out of the portable core |
| Orchestration | Portable idea, not a fixed syntax | Subagents and skills can cooperate | Agent workflows can be repo-packaged | Describe orchestration patterns, not unsupported syntax |

## Officially verified vs inspired

Treat these as officially verified:

- Claude Code skill packaging and discovery concepts documented in Anthropic docs
- Agent Skills packaging as a file-based ecosystem

Treat these as ecosystem inspiration:

- multi-agent role splits from public repos such as `oh-my-agent`
- harness packaging direction from `CLI-Anything`
- GitHub Copilot's repo-level agent and skill direction

Use inspiration to shape the repository, but do not overstate it as a universal runtime contract.

## Writing rule for this repo

When a behavior is vendor-specific:

- mention the tool by name
- place the note in a reference doc
- avoid turning it into a default requirement for every public skill

## Source Notes

- Officially verified: [Anthropic Claude Code slash commands and skills docs](https://code.claude.com/docs/en/slash-commands), [Agent Skills open standard](https://agentskills.io/home)
- Product direction reference: [GitHub Copilot in Visual Studio March 2026 update](https://github.blog/changelog/2026-04-02-github-copilot-in-visual-studio-march-update/)
- Ecosystem inspiration: [oh-my-agent](https://github.com/first-fluke/oh-my-agent), [CLI-Anything](https://github.com/HKUDS/CLI-Anything)
