import http from 'node:http';
import { ErrorInboxStore } from './store.mjs';

function jsonResponse(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
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

function parseIncidentId(pathname) {
  const detailMatch = pathname.match(/^\/incidents\/(\d+)$/);
  if (detailMatch) {
    return {
      incidentId: Number(detailMatch[1]),
      action: 'detail',
    };
  }

  const ackMatch = pathname.match(/^\/incidents\/(\d+)\/ack$/);
  if (ackMatch) {
    return {
      incidentId: Number(ackMatch[1]),
      action: 'ack',
    };
  }

  return null;
}

function formatIncidentLine(incident) {
  return `#${incident.id} [${incident.project}][${incident.environment}] ${incident.severity} ${incident.summary} (repeat ${incident.repeat_count})`;
}

export class TelegramCommandRouter {
  constructor({ store }) {
    this.store = store;
  }

  async handleText(text) {
    const input = String(text || '').trim();

    if (!input || input === '/help') {
      return 'Commands:\n/status\n/recent\n/detail <id>\n/ack <id>';
    }

    if (input === '/status') {
      const openIncidents = this.store.listIncidents({ status: 'open', limit: 10 });
      if (openIncidents.length === 0) {
        return 'Open incidents: 0';
      }

      return [
        `Open incidents: ${openIncidents.length}`,
        ...openIncidents.map(formatIncidentLine),
      ].join('\n');
    }

    if (input === '/recent') {
      const recentEvents = this.store.listRecentEvents({ limit: 5 });
      if (recentEvents.length === 0) {
        return 'Recent events: 0';
      }

      return [
        `Recent events: ${recentEvents.length}`,
        ...recentEvents.map((event) => `${event.occurred_at} [${event.project}] ${event.summary}`),
      ].join('\n');
    }

    const detailMatch = input.match(/^\/detail\s+(\d+)$/);
    if (detailMatch) {
      const incident = this.store.getIncident(Number(detailMatch[1]));
      if (!incident) {
        return `Incident ${detailMatch[1]} not found.`;
      }

      return [
        `Incident #${incident.id}`,
        `status: ${incident.status}`,
        `severity: ${incident.severity}`,
        `summary: ${incident.summary}`,
        `repeat count: ${incident.repeat_count}`,
        `fingerprint: ${incident.fingerprint}`,
        `source: ${incident.source_type} / ${incident.source_name}`,
      ].join('\n');
    }

    const ackMatch = input.match(/^\/ack\s+(\d+)$/);
    if (ackMatch) {
      const incident = this.store.ackIncident(Number(ackMatch[1]), {
        acknowledgedBy: 'telegram',
      });
      return `Incident #${incident.id} acknowledged by telegram.`;
    }

    return 'Unknown command.\nCommands:\n/status\n/recent\n/detail <id>\n/ack <id>';
  }
}

export class TelegramErrorInboxService {
  constructor({ dbPath, store } = {}) {
    this.store = store || new ErrorInboxStore({ dbPath });
  }

  async dispatch(route, { method = 'GET', body = {}, searchParams } = {}) {
    if (route === '/health' && method === 'GET') {
      return {
        ok: true,
        db_path: this.store.dbPath,
      };
    }

    if (route === '/events' && method === 'POST') {
      return this.store.recordEvent(body);
    }

    if (route === '/incidents' && method === 'GET') {
      return {
        incidents: this.store.listIncidents({
          status: searchParams.get('status') || undefined,
        }),
      };
    }

    const incidentRoute = parseIncidentId(route);
    if (incidentRoute?.action === 'detail' && method === 'GET') {
      const incident = this.store.getIncident(incidentRoute.incidentId);
      if (!incident) {
        throw new Error('incident_not_found');
      }
      return { incident };
    }

    if (incidentRoute?.action === 'ack' && method === 'POST') {
      return {
        incident: this.store.ackIncident(incidentRoute.incidentId, {
          acknowledgedBy: body.acknowledgedBy || 'api',
        }),
      };
    }

    throw new Error(`Unknown route: ${method} ${route}`);
  }

  async handleRequest(request, response) {
    try {
      const url = new URL(request.url, 'http://telegram-error-inbox.local');
      const pathname = url.pathname;
      const method = request.method || 'GET';

      if (method !== 'GET' && method !== 'POST') {
        jsonResponse(response, 405, { error: 'method_not_allowed' });
        return;
      }

      const body = method === 'POST' ? await readJsonBody(request) : {};
      const result = await this.dispatch(pathname, {
        method,
        body,
        searchParams: url.searchParams,
      });
      jsonResponse(response, 200, result);
    } catch (error) {
      if (error.message === 'incident_not_found') {
        jsonResponse(response, 404, { error: 'incident_not_found' });
        return;
      }

      if (String(error.message).startsWith('Unknown route:')) {
        jsonResponse(response, 404, { error: 'not_found' });
        return;
      }

      jsonResponse(response, 400, { error: error.message });
    }
  }

  async listen({ port = 0, host = '127.0.0.1' } = {}) {
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
