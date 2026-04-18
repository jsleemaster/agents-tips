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

- `GitHub, gh skill 공개 — 코딩 에이전트 운영의 단위가 프롬프트에서 공급망 관리 가능한 스킬 패키지로 이동`
  Notion URL: `https://www.notion.so/345c796e635e81419c86c9012d6638b4`
  External URL: `https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/`

- `A2A Protocol 1년차 확산 — 멀티에이전트 시장의 병목이 모델 성능에서 상호운용 표준으로 이동`
  Notion URL: `https://www.notion.so/345c796e635e814dba4ddbeb98d56943`
  External URL: `https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year`

- `Mistral Small 4 공개 — 오픈 모델 전략이 단일 체크포인트에서 다기능 통합형 reasoning stack으로 이동`
  Notion URL: `https://www.notion.so/345c796e635e812b8fefde389909f25e`
  External URL: `https://mistral.ai/news/mistral-small-4`

- `GitHub Copilot 데이터 레지던시·FedRAMP 지원 — 코딩 에이전트 경쟁의 기준이 성능에서 규제 적합성으로 확장`
  Notion URL: `https://www.notion.so/345c796e635e81108268de89140d835a`
  External URL: `https://github.blog/changelog/2026-04-13-copilot-data-residency-in-us-eu-and-fedramp-compliance-now-available/`

## Source To Target Mapping

- Source: `📐 Claude Code 팁 (2026) - Agent Optimized`
  Targets:
  - `wiki/claude-code-operating-patterns.md`
  Preferred content:
  - command-level habits
  - context management heuristics
  - hook boundaries
  - MCP usage guidance
  - compact operator defaults

- Source: `📚 Claude Code in Action 과정 + 최신 팁 종합 정리`
  Targets:
  - `wiki/claude-code-operating-patterns.md`
  - `wiki/agent-skill-system-design.md`
  Preferred content:
  - long-form workflow patterns
  - teams vs subagents tradeoffs
  - skill architecture
  - progressive disclosure
  - automation and verification loops

- Source: `🔗 링크 정리`
  Targets:
  - `wiki/open-model-runtime-selection.md`
  - `wiki/agent-skill-system-design.md`
  Routing rules:
  - model families, pricing, context-window signals, deployment fit, and local-vs-hosted escalation go to `wiki/open-model-runtime-selection.md`
  - skill systems, trigger design, metadata, and reusable agent architecture go to `wiki/agent-skill-system-design.md`
  - only route material into `wiki/claude-code-operating-patterns.md` when the link changes day-to-day operator behavior rather than model-selection policy

- Seed page: `Gemma 4 공개 — Apache 2.0 오픈 모델을 agentic workflow 중심으로 재정의`
  Target:
  - `wiki/open-model-runtime-selection.md`

- Seed page: `Alibaba Qwen3.6-Plus 공개 — 1M 컨텍스트·에이전트 코딩, Claude Opus 4.5 수준 달성`
  Target:
  - `wiki/open-model-runtime-selection.md`

- Seed page: `Claude Skills 2.0 - AI 에이전트 스킬 시스템 대규모 업그레이드`
  Target:
  - `wiki/agent-skill-system-design.md`

- Seed page: `GitHub, gh skill 공개 — 코딩 에이전트 운영의 단위가 프롬프트에서 공급망 관리 가능한 스킬 패키지로 이동`
  Target:
  - `wiki/agent-skill-system-design.md`

- Seed page: `A2A Protocol 1년차 확산 — 멀티에이전트 시장의 병목이 모델 성능에서 상호운용 표준으로 이동`
  Target:
  - `wiki/agent-skill-system-design.md`

- Seed page: `Mistral Small 4 공개 — 오픈 모델 전략이 단일 체크포인트에서 다기능 통합형 reasoning stack으로 이동`
  Target:
  - `wiki/open-model-runtime-selection.md`

- Seed page: `GitHub Copilot 데이터 레지던시·FedRAMP 지원 — 코딩 에이전트 경쟁의 기준이 성능에서 규제 적합성으로 확장`
  Target:
  - `wiki/open-model-runtime-selection.md`

## Compilation Policy

- Notion stays the human editing surface.
- `raw/notion/` records which Notion pages seeded the wiki.
- `wiki/` contains distilled pages optimized for retrieval and design questions.
- When new Notion pages are added, compile them into existing wiki pages before adding new top-level pages.
- Follow the source-to-target mapping above before creating a new destination page.
- If a source touches multiple targets, update each target only with the material that matches its scope.
- Only create a new canonical page when the incoming material does not fit any mapped target and introduces a genuinely new decision area.
