import path from 'node:path';

import { DesignWikiEngine } from './engine.mjs';

const rootDir = process.env.DESIGN_WIKI_ROOT
  ? path.resolve(process.env.DESIGN_WIKI_ROOT)
  : process.cwd();
const port = Number(process.env.PORT || 43121);

const engine = new DesignWikiEngine({ rootDir });
const { url } = await engine.listen({ port });

process.stdout.write(`Design wiki engine listening at ${url}\n`);
