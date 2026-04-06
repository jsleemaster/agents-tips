import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

import { HeuristicModelAdapter } from './model-adapter.mjs';

const VAULT_DIRS = [
  'raw',
  'wiki',
  'derived',
  'derived/query-log',
  'derived/draft-updates',
  'derived/ingest-summaries',
  'state',
];

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'because',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'should',
  'the',
  'this',
  'to',
  'use',
  'what',
  'with',
]);

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function timestamp() {
  return new Date().toISOString();
}

function stampForFile() {
  return timestamp().replace(/[:.]/g, '-');
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));
}

function tokensMatch(left, right) {
  if (left === right) {
    return true;
  }

  if (left.length < 4 || right.length < 4) {
    return false;
  }

  return left.startsWith(right.slice(0, 5)) || right.startsWith(left.slice(0, 5));
}

function includesToken(tokens, candidate) {
  return tokens.some((token) => tokensMatch(token, candidate));
}

function titleFromBody(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function parseLinks(body) {
  return Array.from(body.matchAll(/\[\[([^\]]+)\]\]/g), (match) => slugify(match[1]));
}

function extractKeyLines(body) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return {
      data: {},
      body: content,
    };
  }

  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return {
      data: {},
      body: content,
    };
  }

  const rawFrontmatter = content.slice(4, end);
  const body = content.slice(end + 5);
  const lines = rawFrontmatter.split('\n');
  const data = {};
  let currentListKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      currentListKey = null;
      continue;
    }

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentListKey) {
      data[currentListKey] = data[currentListKey] || [];
      data[currentListKey].push(listMatch[1].trim());
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValueMatch) {
      currentListKey = null;
      continue;
    }

    const [, key, rawValue] = keyValueMatch;
    if (rawValue === '') {
      data[key] = [];
      currentListKey = key;
      continue;
    }

    data[key] = rawValue.trim();
    currentListKey = null;
  }

  return { data, body };
}

function renderFrontmatter(data) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const entry of value) {
        lines.push(`  - ${entry}`);
      }
      continue;
    }

    lines.push(`${key}: ${value}`);
  }

  lines.push('---', '');
  return `${lines.join('\n')}`;
}

function upsertFrontmatter(content, patch) {
  const parsed = parseFrontmatter(content);
  const data = {
    ...parsed.data,
    ...patch,
  };
  return `${renderFrontmatter(data)}${parsed.body.replace(/^\n*/, '')}`;
}

function normalizeCitation(page, score) {
  return {
    title: page.title,
    path: page.relativePath,
    score: Number(score.toFixed(3)),
    excerpt: page.keyLines[0] || page.body.slice(0, 180),
  };
}

function findMissingKnowledge(questionTokens, pages) {
  const knownTokens = new Set();

  for (const page of pages) {
    for (const token of page.tokens) {
      knownTokens.add(token);
    }
  }

  const missing = questionTokens.filter((token) => !Array.from(knownTokens).some((known) => tokensMatch(known, token)));
  if (missing.length === 0) {
    return [];
  }

  return [`No grounded wiki coverage for: ${missing.join(', ')}`];
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listMarkdownFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const absolutePath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...await listMarkdownFiles(absolutePath));
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(absolutePath);
      }
    }

    return files.sort();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function readPage(rootDir, absolutePath) {
  const content = await fs.readFile(absolutePath, 'utf8');
  const { data, body } = parseFrontmatter(content);
  const title = data.title || titleFromBody(body) || path.basename(absolutePath, '.md');
  const aliases = Array.isArray(data.aliases) ? data.aliases : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const keyLines = extractKeyLines(body);
  const tokens = tokenize([title, aliases.join(' '), tags.join(' '), body].join(' '));

  return {
    absolutePath,
    relativePath: path.relative(rootDir, absolutePath),
    slug: slugify(data.target_slug || title || path.basename(absolutePath, '.md')),
    title,
    aliases,
    tags,
    body,
    content,
    keyLines,
    links: parseLinks(body),
    tokens,
  };
}

function scorePage(page, queryTokens) {
  if (queryTokens.length === 0) {
    return 0;
  }

  const titleTokens = tokenize(page.title);
  const aliasTokens = tokenize(page.aliases.join(' '));
  const tagTokens = tokenize(page.tags.join(' '));
  let score = 0;

  for (const token of queryTokens) {
    if (includesToken(titleTokens, token)) {
      score += 3;
    } else if (includesToken(aliasTokens, token) || includesToken(tagTokens, token)) {
      score += 2;
    } else if (includesToken(page.tokens, token)) {
      score += 1;
    }
  }

  return score;
}

function applyLinkExpansion(scoredPages) {
  const bySlug = new Map(scoredPages.map((entry) => [entry.page.slug, entry]));

  for (const entry of scoredPages) {
    if (entry.score <= 0) {
      continue;
    }

    for (const linkedSlug of entry.page.links) {
      const linked = bySlug.get(linkedSlug);
      if (!linked) {
        continue;
      }

      linked.score += entry.score * 0.35;
    }
  }

  return scoredPages;
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function jsonResponse(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

export class DesignWikiEngine {
  constructor({ rootDir, modelAdapter } = {}) {
    this.rootDir = rootDir;
    this.modelAdapter = modelAdapter || new HeuristicModelAdapter();
  }

  async ensureStructure() {
    await Promise.all(VAULT_DIRS.map((dir) => ensureDir(path.join(this.rootDir, dir))));
  }

  async loadCorpus() {
    await this.ensureStructure();

    const markdownFiles = [
      ...await listMarkdownFiles(path.join(this.rootDir, 'wiki')),
      ...await listMarkdownFiles(path.join(this.rootDir, 'derived/ingest-summaries')),
    ];

    const pages = await Promise.all(markdownFiles.map((filePath) => readPage(this.rootDir, filePath)));
    await writeJson(path.join(this.rootDir, 'state/index.json'), {
      generated_at: timestamp(),
      pages: pages.map((page) => ({
        slug: page.slug,
        title: page.title,
        path: page.relativePath,
        links: page.links,
      })),
    });
    return pages;
  }

  async query({ question }) {
    if (!question || !String(question).trim()) {
      throw new Error('question is required');
    }

    const pages = await this.loadCorpus();
    const queryTokens = tokenize(question);
    const scoredPages = applyLinkExpansion(pages.map((page) => ({
      page,
      score: scorePage(page, queryTokens),
    })));

    scoredPages.sort((left, right) => right.score - left.score);
    const topEntries = scoredPages.filter((entry) => entry.score > 0).slice(0, 3);
    const citations = topEntries.map((entry) => normalizeCitation(entry.page, entry.score));
    const missingKnowledge = citations.length === 0 ? findMissingKnowledge(queryTokens, pages) : [];
    const suggestedConfidence = citations.length === 0
      ? 0.2
      : Number(Math.min(0.92, 0.42 + (topEntries[0].score * 0.08) + (Math.max(0, citations.length - 1) * 0.06)).toFixed(2));
    const shaped = await this.modelAdapter.answer({
      question,
      queryTokens,
      citations,
      missingKnowledge,
      suggestedConfidence,
    });
    const recommendation = shaped.recommendation;
    const answer = shaped.answer;
    const alternatives = shaped.alternatives || [];
    const confidence = typeof shaped.confidence === 'number' ? shaped.confidence : suggestedConfidence;
    const autoUpdatesApplied = [];
    const draftUpdatesCreated = [];

    if (confidence >= 0.5 && topEntries[0]) {
      const update = await this.appendRelatedQuestion(topEntries[0].page, question);
      if (update) {
        autoUpdatesApplied.push(update);
      }
    } else {
      const draft = await this.createMissingKnowledgeDraft({ question, missingKnowledge });
      draftUpdatesCreated.push(draft);
    }

    await this.writeQueryLog({
      question,
      recommendation,
      answer,
      citations,
      confidence,
      missingKnowledge,
      autoUpdatesApplied,
      draftUpdatesCreated,
    });

    await writeJson(path.join(this.rootDir, 'state/recent-query.json'), {
      question,
      confidence,
      citations,
      saved_at: timestamp(),
    });

    return {
      answer,
      recommendation,
      alternatives,
      citations,
      confidence,
      missing_knowledge: missingKnowledge,
      auto_updates_applied: autoUpdatesApplied,
      draft_updates_created: draftUpdatesCreated,
    };
  }

  async appendRelatedQuestion(page, question) {
    const existing = await fs.readFile(page.absolutePath, 'utf8');
    if (existing.includes(question)) {
      return null;
    }

    let nextContent = existing.trimEnd();
    if (!/##\s+Related Questions/i.test(nextContent)) {
      nextContent += '\n\n## Related Questions\n';
    }

    nextContent += `\n- ${timestamp()} ${question}\n`;
    await fs.writeFile(page.absolutePath, nextContent, 'utf8');
    return `Appended related question to ${page.relativePath}`;
  }

  async createMissingKnowledgeDraft({ question, missingKnowledge }) {
    const title = question.replace(/[?]+$/, '');
    const slug = slugify(title);
    const filePath = path.join(this.rootDir, 'derived/draft-updates', `${slug}.md`);
    const content = `${renderFrontmatter({
      title,
      target_slug: slug,
      status: 'pending',
      created_at: timestamp(),
    })}# Draft Insight

## Missing Knowledge

- ${missingKnowledge.join('\n- ')}

## Source Question

${question}
`;

    await fs.writeFile(filePath, content, 'utf8');
    return {
      slug,
      title,
      path: path.relative(this.rootDir, filePath),
    };
  }

  async writeQueryLog(record) {
    const slug = slugify(record.question);
    const filePath = path.join(this.rootDir, 'derived/query-log', `${stampForFile()}-${slug}.md`);
    const citations = record.citations.map((citation) => `- ${citation.title} (${citation.path})`).join('\n') || '- none';
    const missingKnowledge = record.missingKnowledge.map((item) => `- ${item}`).join('\n') || '- none';
    const autoUpdates = record.autoUpdatesApplied.map((item) => `- ${item}`).join('\n') || '- none';
    const draftUpdates = record.draftUpdatesCreated.map((item) => `- ${item.slug}`).join('\n') || '- none';
    const content = `${renderFrontmatter({
      title: record.question,
      created_at: timestamp(),
      confidence: record.confidence,
    })}# Query Log

## Recommendation

${record.recommendation}

## Answer

${record.answer}

## Citations

${citations}

## Missing Knowledge

${missingKnowledge}

## Auto Updates

${autoUpdates}

## Draft Updates

${draftUpdates}
`;

    await fs.writeFile(filePath, content, 'utf8');
  }

  async ingest({ title, content, sourcePath }) {
    await this.ensureStructure();

    let resolvedTitle = title;
    let resolvedContent = content;
    let resolvedSourcePath = sourcePath;

    if (!resolvedContent && sourcePath) {
      const absoluteSourcePath = path.isAbsolute(sourcePath)
        ? sourcePath
        : path.join(this.rootDir, sourcePath);
      resolvedContent = await fs.readFile(absoluteSourcePath, 'utf8');
      resolvedSourcePath = path.relative(this.rootDir, absoluteSourcePath);
    }

    if (!resolvedContent) {
      throw new Error('content or sourcePath is required');
    }

    if (!resolvedTitle) {
      resolvedTitle = titleFromBody(resolvedContent) || path.basename(resolvedSourcePath || 'ingest.md', '.md');
    }

    const slug = slugify(resolvedTitle);
    const summaryLines = extractKeyLines(resolvedContent).slice(0, 4);
    const summary = summaryLines.join('\n');
    const filePath = path.join(this.rootDir, 'derived/ingest-summaries', `${slug}.md`);
    const fileContent = `${renderFrontmatter({
      title: resolvedTitle,
      source_path: resolvedSourcePath || 'inline',
      created_at: timestamp(),
    })}# Ingest Summary

## Summary

${summary || resolvedContent.slice(0, 280)}
`;

    await fs.writeFile(filePath, fileContent, 'utf8');
    return {
      slug,
      title: resolvedTitle,
      path: path.relative(this.rootDir, filePath),
    };
  }

  async reviewUpdates() {
    await this.ensureStructure();

    const draftFiles = await listMarkdownFiles(path.join(this.rootDir, 'derived/draft-updates'));
    const pending = [];

    for (const absolutePath of draftFiles) {
      const content = await fs.readFile(absolutePath, 'utf8');
      const { data } = parseFrontmatter(content);
      if ((data.status || 'pending') !== 'pending') {
        continue;
      }

      pending.push({
        slug: slugify(data.target_slug || path.basename(absolutePath, '.md')),
        title: data.title || path.basename(absolutePath, '.md'),
        path: path.relative(this.rootDir, absolutePath),
      });
    }

    return { pending };
  }

  async promote({ draftSlug }) {
    if (!draftSlug) {
      throw new Error('draftSlug is required');
    }

    await this.ensureStructure();
    const draftPath = path.join(this.rootDir, 'derived/draft-updates', `${slugify(draftSlug)}.md`);
    const draftContent = await fs.readFile(draftPath, 'utf8');
    const { data, body } = parseFrontmatter(draftContent);
    const targetSlug = slugify(data.target_slug || draftSlug);
    const wikiPath = path.join(this.rootDir, 'wiki', `${targetSlug}.md`);
    await fs.writeFile(wikiPath, body.replace(/^\n*/, ''), 'utf8');
    const updatedDraft = upsertFrontmatter(draftContent, {
      ...data,
      status: 'promoted',
      promoted_at: timestamp(),
    });
    await fs.writeFile(draftPath, updatedDraft, 'utf8');

    return {
      promoted: {
        slug: targetSlug,
        title: data.title || targetSlug,
        path: path.relative(this.rootDir, wikiPath),
      },
    };
  }

  async dispatch(route, body = {}) {
    if (route === '/query') {
      return this.query(body);
    }

    if (route === '/ingest') {
      return this.ingest(body);
    }

    if (route === '/review-updates') {
      return this.reviewUpdates(body);
    }

    if (route === '/promote') {
      return this.promote(body);
    }

    throw new Error(`Unknown route: ${route}`);
  }

  async handleRequest(request, response) {
    try {
      if (request.method !== 'POST') {
        jsonResponse(response, 405, { error: 'method_not_allowed' });
        return;
      }

      const body = await readJsonBody(request);
      jsonResponse(response, 200, await this.dispatch(request.url, body));
    } catch (error) {
      if (String(error.message).startsWith('Unknown route:')) {
        jsonResponse(response, 404, { error: 'not_found' });
        return;
      }

      jsonResponse(response, 500, {
        error: error.message,
      });
    }
  }

  async listen({ port = 0, host = '127.0.0.1' } = {}) {
    await this.ensureStructure();

    const server = http.createServer((request, response) => {
      this.handleRequest(request, response);
    });

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.off('error', reject);
        resolve();
      });
    });

    const address = server.address();
    return {
      server,
      url: `http://${host}:${address.port}`,
    };
  }
}
