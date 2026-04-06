import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReviewMarkdown,
  buildQueryMarkdown,
  parseSlugChoice,
} from '../../obsidian-plugin/design-wiki-thin-wrapper/plugin-utils.mjs';

test('plugin utilities format query responses for Obsidian', () => {
  const markdown = buildQueryMarkdown({
    recommendation: 'Start with lexical search and link expansion.',
    answer: 'This is the best v1 because it keeps the system legible.',
    alternatives: ['Add vector search later.'],
    citations: [{ title: 'Retrieval Strategy', path: 'wiki/retrieval-strategy.md' }],
    confidence: 0.82,
    missing_knowledge: ['No production metrics page yet.'],
    auto_updates_applied: ['Appended related question to wiki/retrieval-strategy.md'],
    draft_updates_created: [],
  });

  assert.match(markdown, /Recommended Approach/i);
  assert.match(markdown, /Retrieval Strategy/);
  assert.match(markdown, /Confidence: 0.82/);
});

test('plugin utilities format pending drafts and parse slug choices', () => {
  const markdown = buildReviewMarkdown({
    pending: [
      {
        slug: 'deployment-approvals',
        title: 'Deployment approvals',
        path: 'derived/draft-updates/deployment-approvals.md',
      },
    ],
  });

  assert.match(markdown, /deployment-approvals/);
  assert.equal(parseSlugChoice('deployment-approvals - Deployment approvals'), 'deployment-approvals');
});
