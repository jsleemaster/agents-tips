import { spawn } from 'node:child_process';

function parseJsonObject(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    const match = String(value).match(/\{[\s\S]*\}/);
    if (!match) {
      throw error;
    }

    return JSON.parse(match[0]);
  }
}

function buildOllamaSystemPrompt() {
  return `You are a closed-world project design advisor.

Rules:
- Use only the provided wiki evidence.
- Do not invent citations or unstated facts.
- If evidence is thin, say so directly.
- Prefer a concrete recommendation over a vague survey.
- Return valid JSON only.

Return this JSON shape:
{
  "answer": "string",
  "recommendation": "string",
  "alternatives": ["string"],
  "confidence": 0.0
}`;
}

function buildOllamaUserPrompt(payload) {
  const citations = payload.citations.length === 0
    ? '- none'
    : payload.citations
      .map((citation) => `- ${citation.title} | ${citation.path} | ${citation.excerpt}`)
      .join('\n');
  const missingKnowledge = payload.missingKnowledge.length === 0
    ? '- none'
    : payload.missingKnowledge.map((item) => `- ${item}`).join('\n');

  return `Question:
${payload.question}

Suggested confidence:
${payload.suggestedConfidence}

Citations:
${citations}

Missing knowledge:
${missingKnowledge}`;
}

function defaultAnswer({ recommendation, citations, missingKnowledge }) {
  if (citations.length === 0) {
    return `The best answer I can give from the current wiki is that it does not yet contain enough grounded evidence to recommend a design. Before making a stronger recommendation, fill the missing areas and rerun the query.`;
  }

  const topCitation = citations[0];
  const rationale = `This is the best v1 because ${topCitation.title} is the strongest matching page and the answer stays grounded in the existing wiki.`;
  const gapSentence = missingKnowledge.length > 0
    ? ` The current wiki still lacks: ${missingKnowledge.join('; ')}.`
    : '';

  return `The best recommendation is to ${recommendation.charAt(0).toLowerCase()}${recommendation.slice(1)} ${rationale}${gapSentence}`;
}

function buildAlternatives(citations) {
  return citations.slice(1, 3).map((citation) => `Alternative reference: ${citation.excerpt}`);
}

function chooseRecommendation(citations) {
  if (citations.length === 0) {
    return 'State that the current wiki does not contain enough grounded evidence yet.';
  }

  return citations[0].excerpt || `Start from ${citations[0].title}.`;
}

export class HeuristicModelAdapter {
  async answer(payload) {
    const recommendation = chooseRecommendation(payload.citations);
    const answer = defaultAnswer({
      recommendation,
      citations: payload.citations,
      missingKnowledge: payload.missingKnowledge,
    });

    return {
      answer,
      recommendation,
      alternatives: buildAlternatives(payload.citations),
      confidence: payload.suggestedConfidence,
    };
  }
}

export class CommandModelAdapter {
  constructor({ command, args = [], env = {} }) {
    if (!command) {
      throw new Error('command is required');
    }

    this.command = command;
    this.args = args;
    this.env = env;
  }

  async answer(payload) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, this.args, {
        env: {
          ...process.env,
          ...this.env,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const stdout = [];
      const stderr = [];

      child.stdout.on('data', (chunk) => stdout.push(chunk));
      child.stderr.on('data', (chunk) => stderr.push(chunk));
      child.on('error', reject);
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Model command failed with code ${code}: ${Buffer.concat(stderr).toString('utf8')}`));
          return;
        }

        try {
          resolve(JSON.parse(Buffer.concat(stdout).toString('utf8')));
        } catch (error) {
          reject(error);
        }
      });

      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    });
  }
}

export class OllamaModelAdapter {
  constructor({
    baseUrl = 'http://127.0.0.1:11434',
    model = 'gemma4:e4b',
    think = 'low',
    keepAlive = '5m',
    fetchFn = globalThis.fetch,
    options = {
      temperature: 1,
      top_p: 0.95,
      top_k: 64,
    },
  } = {}) {
    if (!fetchFn) {
      throw new Error('fetchFn is required for OllamaModelAdapter');
    }

    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.think = think;
    this.keepAlive = keepAlive;
    this.fetchFn = fetchFn;
    this.options = options;
  }

  async answer(payload) {
    const response = await this.fetchFn(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: 'json',
        think: this.think,
        keep_alive: this.keepAlive,
        options: this.options,
        messages: [
          {
            role: 'system',
            content: buildOllamaSystemPrompt(),
          },
          {
            role: 'user',
            content: buildOllamaUserPrompt(payload),
          },
        ],
      }),
    });

    if (!response.ok) {
      let details = '';
      try {
        details = JSON.stringify(await response.json());
      } catch {
        details = `status ${response.status}`;
      }
      throw new Error(`Ollama request failed: ${details}`);
    }

    const body = await response.json();
    const content = body?.message?.content || body?.response;
    const parsed = parseJsonObject(content);

    return {
      answer: parsed.answer,
      recommendation: parsed.recommendation,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : payload.suggestedConfidence,
    };
  }
}

export function createModelAdapterFromEnv({ env = process.env, fetchFn = globalThis.fetch } = {}) {
  const backend = env.DESIGN_WIKI_MODEL_BACKEND || (env.DESIGN_WIKI_OLLAMA_MODEL ? 'ollama' : 'heuristic');

  if (backend === 'ollama') {
    return new OllamaModelAdapter({
      baseUrl: env.DESIGN_WIKI_OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      model: env.DESIGN_WIKI_OLLAMA_MODEL || 'gemma4:e4b',
      think: env.DESIGN_WIKI_OLLAMA_THINK || 'low',
      keepAlive: env.DESIGN_WIKI_OLLAMA_KEEP_ALIVE || '5m',
      fetchFn,
    });
  }

  return new HeuristicModelAdapter();
}
