import path from 'node:path';

import { DesignWikiEngine } from './engine.mjs';
import { createModelAdapterFromEnv } from './model-adapter.mjs';

const rootDir = process.env.DESIGN_WIKI_ROOT
  ? path.resolve(process.env.DESIGN_WIKI_ROOT)
  : process.cwd();
const port = Number(process.env.PORT || 43121);
const modelAdapter = createModelAdapterFromEnv();

const engine = new DesignWikiEngine({ rootDir, modelAdapter });
const { url } = await engine.listen({ port });

const backendLabel = process.env.DESIGN_WIKI_MODEL_BACKEND || (process.env.DESIGN_WIKI_OLLAMA_MODEL ? 'ollama' : 'heuristic');
const modelLabel = backendLabel === 'ollama'
  ? ` (${process.env.DESIGN_WIKI_OLLAMA_MODEL || 'gemma4:e4b'})`
  : '';

process.stdout.write(`Design wiki engine listening at ${url} using ${backendLabel}${modelLabel}\n`);
