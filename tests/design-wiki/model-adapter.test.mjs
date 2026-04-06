import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CommandModelAdapter,
  OllamaModelAdapter,
  createModelAdapterFromEnv,
} from '../../src/design-wiki/model-adapter.mjs';

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

test('ollama model adapter posts a structured chat request and parses JSON content', async () => {
  const requests = [];
  const adapter = new OllamaModelAdapter({
    model: 'gemma4:e4b',
    baseUrl: 'http://127.0.0.1:11434',
    think: 'low',
    fetchFn: async (url, options) => {
      requests.push({
        url,
        options: {
          ...options,
          body: JSON.parse(options.body),
        },
      });

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            message: {
              content: JSON.stringify({
                answer: 'Ground the answer in the wiki, then recommend the narrowest MVP.',
                recommendation: 'Start with a one-screen journaling flow.',
                alternatives: ['Add timeline review later.'],
                confidence: 0.74,
              }),
            },
          };
        },
      };
    },
  });

  const result = await adapter.answer({
    question: 'How should I scope the MVP for a journaling app?',
    citations: [
      {
        title: 'MVP Scoping',
        path: 'wiki/mvp-scoping.md',
        excerpt: 'Start with the narrowest workflow that proves the habit loop.',
      },
    ],
    missingKnowledge: [],
    suggestedConfidence: 0.51,
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://127.0.0.1:11434/api/chat');
  assert.equal(requests[0].options.body.model, 'gemma4:e4b');
  assert.equal(requests[0].options.body.stream, false);
  assert.equal(requests[0].options.body.format, 'json');
  assert.equal(requests[0].options.body.think, 'low');
  assert.equal(requests[0].options.body.messages[0].role, 'system');
  assert.match(requests[0].options.body.messages[1].content, /journaling app/i);
  assert.equal(result.recommendation, 'Start with a one-screen journaling flow.');
  assert.equal(result.confidence, 0.74);
});

test('createModelAdapterFromEnv selects ollama when configured', () => {
  const adapter = createModelAdapterFromEnv({
    env: {
      DESIGN_WIKI_MODEL_BACKEND: 'ollama',
      DESIGN_WIKI_OLLAMA_MODEL: 'gemma4:e4b',
      DESIGN_WIKI_OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
      DESIGN_WIKI_OLLAMA_THINK: 'low',
    },
    fetchFn: async () => ({
      ok: true,
      async json() {
        return {
          message: {
            content: JSON.stringify({
              answer: 'ok',
              recommendation: 'ok',
              alternatives: [],
              confidence: 0.4,
            }),
          },
        };
      },
    }),
  });

  assert.equal(adapter.constructor.name, 'OllamaModelAdapter');
  assert.equal(adapter.model, 'gemma4:e4b');
});
