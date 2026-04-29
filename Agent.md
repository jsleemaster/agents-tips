# Agent Notes

Keep this repo retrieval-oriented and small.

- Treat `raw/notion/source-registry.md` as the routing contract for wiki syncs.
- Update mapped `wiki/` pages before considering any new top-level canonical page.
- Do not edit `derived/` or `state/` during Notion wiki sync work.
- Do not keep runtime residue such as `## Related Questions` or query-writeback traces in canonical pages.
- Prefer no-op over filler edits when a mapped page has no clean retrieval-value delta.
- Run `npm test` and `bash scripts/validate-skills.sh` before calling the sync complete.
- If canonical files changed, commit from the branch-bearing checkout at `/Users/smlee/agent-tips`, not a detached worktree.
