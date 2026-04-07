const SEVERITIES = new Set(['critical', 'high', 'medium', 'recovery']);
const STATUSES = new Set(['open', 'repeated', 'recovered']);
const SOURCE_TYPES = new Set(['automation', 'deploy', 'service', 'monitor']);

function requireText(value, fieldName) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${fieldName} is required`);
  }
  return text;
}

function requireEnum(value, fieldName, allowed) {
  const text = requireText(value, fieldName);
  if (!allowed.has(text)) {
    throw new Error(`${fieldName} must be one of: ${Array.from(allowed).join(', ')}`);
  }
  return text;
}

function normalizeStringArray(value, fieldName) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  return value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
}

function normalizeMetadata(value) {
  if (value == null) {
    return {};
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('metadata must be an object');
  }

  return value;
}

function normalizeTimestamp(value) {
  const text = requireText(value, 'occurred_at');
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error('occurred_at must be a valid ISO timestamp');
  }
  return date.toISOString();
}

export function normalizeErrorEvent(input = {}) {
  const normalized = {
    event_id: requireText(input.event_id, 'event_id'),
    project: requireText(input.project, 'project'),
    environment: requireText(input.environment, 'environment'),
    fingerprint: requireText(input.fingerprint, 'fingerprint'),
    severity: requireEnum(input.severity, 'severity', SEVERITIES),
    status: requireEnum(input.status, 'status', STATUSES),
    source_type: requireEnum(input.source_type, 'source_type', SOURCE_TYPES),
    source_name: requireText(input.source_name, 'source_name'),
    summary: requireText(input.summary, 'summary'),
    occurred_at: normalizeTimestamp(input.occurred_at),
    details: input.details == null ? '' : String(input.details).trim(),
    links: normalizeStringArray(input.links, 'links'),
    tags: normalizeStringArray(input.tags, 'tags'),
    runbook_url: input.runbook_url == null ? '' : String(input.runbook_url).trim(),
    metadata: normalizeMetadata(input.metadata),
  };

  return normalized;
}

export const ERROR_EVENT_ENUMS = {
  severities: Array.from(SEVERITIES),
  statuses: Array.from(STATUSES),
  sourceTypes: Array.from(SOURCE_TYPES),
};
