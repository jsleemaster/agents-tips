import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { DesignWikiEngine } from '../../src/design-wiki/engine.mjs';

async function makeVault(structure) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-wiki-'));

  for (const [relativePath, content] of Object.entries(structure)) {
    const absolutePath = path.join(root, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content, 'utf8');
  }

  return root;
}

test('query uses wiki evidence, returns structured closed-world answer, and logs low-risk updates', async () => {
  const vaultRoot = await makeVault({
    'wiki/retrieval-strategy.md': `---
title: Retrieval Strategy
aliases:
  - Search Strategy
tags:
  - retrieval
---

# Retrieval Strategy

Start with lexical search and explicit page links before introducing vector infrastructure.

## Guidance

- Prefer BM25-style lexical ranking for early design wikis.
- Expand top results through linked pages to recover nearby context.
- Keep the answer opinionated and grounded in cited pages.

## Links

- [[Writeback Policy]]
`,
    'wiki/writeback-policy.md': `# Writeback Policy

Low-risk changes can be applied automatically:

- append related questions
- add small examples
- enrich aliases or tags

Structural changes should become drafts first.
`,
  });

  const engine = new DesignWikiEngine({ rootDir: vaultRoot });
  const response = await engine.query({
    question: 'How should I design retrieval for a project design wiki?',
  });

  assert.equal(Array.isArray(response.citations), true);
  assert.equal(response.citations.length > 0, true);
  assert.match(response.recommendation, /lexical search/i);
  assert.match(response.answer, /best/i);
  assert.equal(typeof response.confidence, 'number');
  assert.equal(response.confidence > 0.5, true);
  assert.deepEqual(response.missing_knowledge, []);
  assert.equal(Array.isArray(response.auto_updates_applied), true);
  assert.equal(response.auto_updates_applied.length > 0, true);
  assert.equal(Array.isArray(response.draft_updates_created), true);
  assert.equal(response.draft_updates_created.length, 0);

  const updatedPage = await fs.readFile(path.join(vaultRoot, 'wiki/retrieval-strategy.md'), 'utf8');
  assert.match(updatedPage, /Related Questions/i);
  assert.match(updatedPage, /How should I design retrieval for a project design wiki\?/);

  const queryLogDir = path.join(vaultRoot, 'derived/query-log');
  const queryLogFiles = await fs.readdir(queryLogDir);
  assert.equal(queryLogFiles.length, 1);
});

test('query can delegate final answer shaping to an injected model adapter', async () => {
  const vaultRoot = await makeVault({
    'wiki/retrieval-strategy.md': `# Retrieval Strategy

Start with lexical search first.
`,
  });

  const seenPayloads = [];
  const engine = new DesignWikiEngine({
    rootDir: vaultRoot,
    modelAdapter: {
      async answer(payload) {
        seenPayloads.push(payload);
        return {
          answer: 'Custom adapter answer.',
          recommendation: 'Use lexical search first.',
          alternatives: ['Add link expansion next.'],
          confidence: 0.77,
        };
      },
    },
  });

  const response = await engine.query({
    question: 'How should I retrieve wiki pages?',
  });

  assert.equal(seenPayloads.length, 1);
  assert.match(seenPayloads[0].question, /retrieve wiki pages/i);
  assert.equal(seenPayloads[0].citations.length > 0, true);
  assert.equal(response.answer, 'Custom adapter answer.');
  assert.equal(response.recommendation, 'Use lexical search first.');
});

test('query exposes missing knowledge and creates a review draft when evidence is weak', async () => {
  const vaultRoot = await makeVault({
    'wiki/retrieval-strategy.md': `# Retrieval Strategy

Use lexical search first.
`,
  });

  const engine = new DesignWikiEngine({ rootDir: vaultRoot });
  const response = await engine.query({
    question: 'How should I design deployment approvals for a finance workflow?',
  });

  assert.equal(response.citations.length, 0);
  assert.equal(response.confidence < 0.35, true);
  assert.equal(response.missing_knowledge.length > 0, true);
  assert.equal(response.auto_updates_applied.length, 0);
  assert.equal(response.draft_updates_created.length, 1);

  const draftsDir = path.join(vaultRoot, 'derived/draft-updates');
  const drafts = await fs.readdir(draftsDir);
  assert.equal(drafts.length, 1);

  const draftContent = await fs.readFile(path.join(draftsDir, drafts[0]), 'utf8');
  assert.match(draftContent, /Missing Knowledge/i);
  assert.match(draftContent, /finance workflow/i);
});

test('query clamps model output to a closed-world fallback when citations are empty', async () => {
  const vaultRoot = await makeVault({
    'wiki/retrieval-strategy.md': `# Retrieval Strategy

Use lexical search first.
`,
  });

  const engine = new DesignWikiEngine({
    rootDir: vaultRoot,
    modelAdapter: {
      async answer() {
        return {
          answer: 'You should interview users and define a pain point first.',
          recommendation: 'Build a one-screen journaling MVP first.',
          alternatives: ['Start with emotion tracking instead.'],
          confidence: 0.9,
        };
      },
    },
  });

  const response = await engine.query({
    question: '아 일기 쓰는 프로젝트를 하고 싶은데 MVP 범위를 어떻게 자르는게 좋지?',
  });

  assert.equal(response.citations.length, 0);
  assert.equal(response.alternatives.length, 0);
  assert.equal(response.confidence <= 0.2, true);
  assert.match(response.recommendation, /grounded evidence|근거/i);
  assert.doesNotMatch(response.recommendation, /one-screen journaling/i);
});

test('reviewUpdates lists pending drafts and promote turns one into a canonical wiki page', async () => {
  const vaultRoot = await makeVault({
    'derived/draft-updates/deployment-approvals.md': `---
title: Deployment approvals
target_slug: deployment-approvals
status: pending
---

# Draft Insight

## Summary

Approval rules for deployment workflows need a canonical page.
`,
  });

  const engine = new DesignWikiEngine({ rootDir: vaultRoot });
  const review = await engine.reviewUpdates();

  assert.equal(review.pending.length, 1);
  assert.equal(review.pending[0].slug, 'deployment-approvals');

  const promote = await engine.promote({
    draftSlug: 'deployment-approvals',
  });

  assert.equal(promote.promoted.slug, 'deployment-approvals');

  const wikiPage = await fs.readFile(path.join(vaultRoot, 'wiki/deployment-approvals.md'), 'utf8');
  assert.match(wikiPage, /Draft Insight/i);

  const draftRecord = await fs.readFile(path.join(vaultRoot, 'derived/draft-updates/deployment-approvals.md'), 'utf8');
  assert.match(draftRecord, /status: promoted/i);
});

test('dispatch exposes the same contract as the HTTP routes', async () => {
  const vaultRoot = await makeVault({
    'wiki/retrieval-strategy.md': `# Retrieval Strategy

Use lexical search first and expand links.
`,
  });

  const engine = new DesignWikiEngine({ rootDir: vaultRoot });
  const queryResult = await engine.dispatch('/query', {
    question: 'What retrieval approach should I use?',
  });
  const reviewResult = await engine.dispatch('/review-updates', {});

  assert.match(queryResult.recommendation, /lexical/i);
  assert.equal(Array.isArray(reviewResult.pending), true);
});
