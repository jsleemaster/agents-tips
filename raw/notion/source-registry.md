# Notion Source Registry

This design wiki treats selected Notion pages as the human-curated source of truth.

## Primary Sources

- Source type: database
  Title: `🔗 링크 정리`
  Notion URL: `https://www.notion.so/3e017ddc25494bf2971a2c96ff618c32`
  Data source URL: `collection://9de9a850-d4d0-4371-bdd2-3de98848672a`
  Role: curated AI links, tool signals, model/runtimes, trend tracking

- Source type: page
  Title: `📐 Claude Code 팁 (2026) - Agent Optimized`
  Notion URL: `https://www.notion.so/321c796e635e815db7b0f3d673703f7a`
  Role: compact operator notes and command-level guidance

- Source type: page
  Title: `📚 Claude Code in Action 과정 + 최신 팁 종합 정리`
  Notion URL: `https://www.notion.so/325c796e635e8190817af565bc33bb82`
  Role: long-form course notes, workflows, commands, hooks, MCP, subagents

## Seed Pages Used From The Link Archive

- `Gemma 4 공개 — Apache 2.0 오픈 모델을 agentic workflow 중심으로 재정의`
  Notion URL: `https://www.notion.so/337c796e635e81d2ad66f6b6eedacb0f`
  External URL: `https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/`

- `Alibaba Qwen3.6-Plus 공개 — 1M 컨텍스트·에이전트 코딩, Claude Opus 4.5 수준 달성`
  Notion URL: `https://www.notion.so/336c796e635e815b86b4f24745a492c8`
  External URL: `https://dataconomy.com/2026/04/02/alibaba-launches-qwen3-6-plus-for-enterprise-ai-applications/`

- `Claude Skills 2.0 - AI 에이전트 스킬 시스템 대규모 업그레이드`
  Notion URL: `https://www.notion.so/32cc796e635e811083a9ed787671e452`
  External URL: `https://medium.com/data-science-collective/how-to-build-claude-skills-2-0-better-than-99-of-people-af4927dd5335`

## Compilation Policy

- Notion stays the human editing surface.
- `raw/notion/` records which Notion pages seeded the wiki.
- `wiki/` contains distilled pages optimized for retrieval and design questions.
- When new Notion pages are added, compile them into existing wiki pages before adding new top-level pages.
