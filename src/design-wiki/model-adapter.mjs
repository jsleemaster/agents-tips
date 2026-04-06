import { spawn } from 'node:child_process';

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
