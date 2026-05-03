# Agent Notes

Keep this repo retrieval-oriented and small.

- Treat `raw/notion/source-registry.md` as the routing contract for wiki syncs.
- Update mapped `wiki/` pages before considering any new top-level canonical page.
- Do not edit `derived/` or `state/` during Notion wiki sync work.
- Do not keep runtime residue such as `## Related Questions` or query-writeback traces in canonical pages.
- Prefer no-op over filler edits when a mapped page has no clean retrieval-value delta.
- Route `🔗 링크 정리` updates by topic: model, context, compliance, cloud-host fit, and hardware/deployment gates go to `wiki/open-model-runtime-selection.md`; skill packaging, governance, control-plane, interoperability, and rollout policy go to `wiki/agent-skill-system-design.md`.
- Route `🔗 링크 정리` quality or postmortem notes about prompt policy, default reasoning effort, cache behavior, rollout discipline, or eval hygiene to `wiki/agent-skill-system-design.md` unless they clearly change day-to-day operator commands.
- Route `🔗 링크 정리` notes about reasoning continuity, repo-level task completion, or model-plus-agent-surface fit to `wiki/open-model-runtime-selection.md`.
- Route `🔗 링크 정리` notes about managed runtimes, background agents, audit logs, approval boundaries, or local-cloud tool parity to `wiki/open-model-runtime-selection.md` when they change runtime-selection criteria, and to `wiki/agent-skill-system-design.md` when they mainly change governance or control-plane design.
- If a new `🔗 링크 정리` item mainly says the same governance story in a different vendor wrapper, prefer no wiki edit; only patch canonical pages when the source adds a cleaner retrieval hook such as local-plugin plus cloud-agent control-plane convergence or a new host-cloud procurement constraint.
- Only touch `wiki/claude-code-operating-patterns.md` when a source changes day-to-day operator behavior, not when it only changes platform or model policy.
- Run `npm test` and `bash scripts/validate-skills.sh` before calling the sync complete.
- If canonical files changed, commit from the branch-bearing checkout at `/Users/smlee/agent-tips`, not a detached worktree.
