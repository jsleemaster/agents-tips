export function buildQueryMarkdown(result) {
  const citations = (result.citations || [])
    .map((citation) => `- ${citation.title} (${citation.path})`)
    .join('\n') || '- none';
  const alternatives = (result.alternatives || [])
    .map((alternative) => `- ${alternative}`)
    .join('\n') || '- none';
  const missingKnowledge = (result.missing_knowledge || [])
    .map((item) => `- ${item}`)
    .join('\n') || '- none';
  const autoUpdates = (result.auto_updates_applied || [])
    .map((item) => `- ${item}`)
    .join('\n') || '- none';
  const draftUpdates = (result.draft_updates_created || [])
    .map((item) => `- ${item.slug} (${item.path})`)
    .join('\n') || '- none';

  return `# Design Wiki Answer

## Recommended Approach

${result.recommendation}

## Why This Is Best

${result.answer}

## Alternatives

${alternatives}

## Citations

${citations}

## Confidence: ${Number(result.confidence || 0).toFixed(2)}

## Missing Knowledge

${missingKnowledge}

## Auto Updates Applied

${autoUpdates}

## Draft Updates Created

${draftUpdates}
`;
}

export function buildReviewMarkdown(review) {
  const pending = (review.pending || [])
    .map((draft) => `- ${draft.slug} | ${draft.title} | ${draft.path}`)
    .join('\n') || '- none';

  return `# Pending Draft Updates

${pending}
`;
}

export function parseSlugChoice(value) {
  return String(value).split(' - ')[0].trim();
}
