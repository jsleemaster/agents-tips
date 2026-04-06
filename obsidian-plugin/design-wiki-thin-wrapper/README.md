# Design Wiki Thin Wrapper

This Obsidian plugin keeps the UI thin and forwards work to the local design wiki engine.

## Commands

- `Ask Design Wiki`
- `Review Suggested Updates`
- `Promote Draft Insight`

## Setup

1. Copy this folder into `<vault>/.obsidian/plugins/design-wiki-thin-wrapper`.
2. Enable the plugin in Obsidian community plugins.
3. Start the local engine with:

```bash
npm run start:design-wiki
```

4. Point the plugin setting at the engine URL if it differs from `http://127.0.0.1:43121`.
