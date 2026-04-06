import test from 'node:test';
import assert from 'node:assert/strict';

import { CommandModelAdapter } from '../../src/design-wiki/model-adapter.mjs';

test('command model adapter shells out to a local process and parses JSON output', async () => {
  const adapter = new CommandModelAdapter({
    command: process.execPath,
    args: [
      '-e',
      `
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', () => {
  const payload = JSON.parse(input);
  const response = {
    answer: 'CLI adapter answer for ' + payload.question,
    recommendation: 'Use the highest scoring citation first.',
    alternatives: ['Fallback to heuristic mode.'],
    confidence: 0.66
  };
  process.stdout.write(JSON.stringify(response));
});
      `,
    ],
  });

  const result = await adapter.answer({
    question: 'How should I shape final answers?',
    citations: [{ title: 'Retrieval Strategy', path: 'wiki/retrieval-strategy.md' }],
    missingKnowledge: [],
    suggestedConfidence: 0.5,
  });

  assert.match(result.answer, /shape final answers/i);
  assert.equal(result.recommendation, 'Use the highest scoring citation first.');
  assert.equal(result.confidence, 0.66);
});
