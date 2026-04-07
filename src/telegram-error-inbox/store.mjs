import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

import { normalizeErrorEvent } from './schema.mjs';

function nowIso() {
  return new Date().toISOString();
}

function toJson(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serializeIncidentRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    links: parseJson(row.links_json, []),
    tags: parseJson(row.tags_json, []),
    metadata: parseJson(row.metadata_json, {}),
  };
}

function serializeEventRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    links: parseJson(row.links_json, []),
    tags: parseJson(row.tags_json, []),
    metadata: parseJson(row.metadata_json, {}),
  };
}

export class ErrorInboxStore {
  constructor({ dbPath } = {}) {
    if (!dbPath) {
      throw new Error('dbPath is required');
    }

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.dbPath = dbPath;
    this.db = new DatabaseSync(dbPath);
    this.ensureSchema();
  }

  ensureSchema() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project TEXT NOT NULL,
        environment TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_name TEXT NOT NULL,
        summary TEXT NOT NULL,
        details TEXT NOT NULL,
        runbook_url TEXT NOT NULL,
        links_json TEXT NOT NULL DEFAULT '[]',
        tags_json TEXT NOT NULL DEFAULT '[]',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        last_event_status TEXT NOT NULL,
        repeat_count INTEGER NOT NULL DEFAULT 1,
        acknowledged_at TEXT,
        acknowledged_by TEXT,
        closed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS incidents_open_key
      ON incidents(project, environment, fingerprint)
      WHERE status = 'open';

      CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        incident_id INTEGER,
        project TEXT NOT NULL,
        environment TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_name TEXT NOT NULL,
        summary TEXT NOT NULL,
        details TEXT NOT NULL,
        runbook_url TEXT NOT NULL,
        links_json TEXT NOT NULL DEFAULT '[]',
        tags_json TEXT NOT NULL DEFAULT '[]',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        occurred_at TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents(id)
      );
    `);
  }

  getIncident(id) {
    const row = this.db.prepare(`
      SELECT *
      FROM incidents
      WHERE id = ?
    `).get(id);
    return serializeIncidentRow(row);
  }

  listIncidents({ status, limit = 50 } = {}) {
    const rows = status
      ? this.db.prepare(`
          SELECT *
          FROM incidents
          WHERE status = ?
          ORDER BY last_seen_at DESC
          LIMIT ?
        `).all(status, limit)
      : this.db.prepare(`
          SELECT *
          FROM incidents
          ORDER BY last_seen_at DESC
          LIMIT ?
        `).all(limit);

    return rows.map(serializeIncidentRow);
  }

  listRecentEvents({ limit = 10 } = {}) {
    const rows = this.db.prepare(`
      SELECT *
      FROM events
      ORDER BY occurred_at DESC
      LIMIT ?
    `).all(limit);

    return rows.map(serializeEventRow);
  }

  ackIncident(id, { acknowledgedBy = 'unknown' } = {}) {
    const incident = this.getIncident(id);
    if (!incident) {
      throw new Error(`incident ${id} not found`);
    }

    const acknowledgedAt = nowIso();
    this.db.prepare(`
      UPDATE incidents
      SET acknowledged_at = ?, acknowledged_by = ?, updated_at = ?
      WHERE id = ?
    `).run(acknowledgedAt, acknowledgedBy, acknowledgedAt, id);

    return this.getIncident(id);
  }

  recordEvent(eventInput) {
    const event = normalizeErrorEvent(eventInput);
    const duplicate = this.db.prepare(`
      SELECT *
      FROM events
      WHERE event_id = ?
    `).get(event.event_id);

    if (duplicate) {
      return {
        event: serializeEventRow(duplicate),
        incident: this.getIncident(duplicate.incident_id),
      };
    }

    const recordedAt = nowIso();
    const existingOpen = this.db.prepare(`
      SELECT *
      FROM incidents
      WHERE project = ?
        AND environment = ?
        AND fingerprint = ?
        AND status = 'open'
      LIMIT 1
    `).get(event.project, event.environment, event.fingerprint);

    let incidentId;

    if (event.status === 'recovered') {
      if (existingOpen) {
        incidentId = existingOpen.id;
        this.db.prepare(`
          UPDATE incidents
          SET severity = ?,
              status = 'recovered',
              source_type = ?,
              source_name = ?,
              summary = ?,
              details = ?,
              runbook_url = ?,
              links_json = ?,
              tags_json = ?,
              metadata_json = ?,
              last_seen_at = ?,
              last_event_status = ?,
              closed_at = ?,
              updated_at = ?
          WHERE id = ?
        `).run(
          event.severity,
          event.source_type,
          event.source_name,
          event.summary,
          event.details,
          event.runbook_url,
          toJson(event.links, []),
          toJson(event.tags, []),
          toJson(event.metadata, {}),
          event.occurred_at,
          event.status,
          event.occurred_at,
          recordedAt,
          incidentId,
        );
      } else {
        incidentId = this.db.prepare(`
          INSERT INTO incidents (
            project, environment, fingerprint, severity, status, source_type, source_name,
            summary, details, runbook_url, links_json, tags_json, metadata_json,
            first_seen_at, last_seen_at, last_event_status, repeat_count, closed_at,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'recovered', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        `).run(
          event.project,
          event.environment,
          event.fingerprint,
          event.severity,
          event.source_type,
          event.source_name,
          event.summary,
          event.details,
          event.runbook_url,
          toJson(event.links, []),
          toJson(event.tags, []),
          toJson(event.metadata, {}),
          event.occurred_at,
          event.occurred_at,
          event.status,
          event.occurred_at,
          recordedAt,
          recordedAt,
        ).lastInsertRowid;
      }
    } else if (existingOpen) {
      incidentId = existingOpen.id;
      this.db.prepare(`
        UPDATE incidents
        SET severity = ?,
            source_type = ?,
            source_name = ?,
            summary = ?,
            details = ?,
            runbook_url = ?,
            links_json = ?,
            tags_json = ?,
            metadata_json = ?,
            last_seen_at = ?,
            last_event_status = ?,
            repeat_count = repeat_count + 1,
            updated_at = ?
        WHERE id = ?
      `).run(
        event.severity,
        event.source_type,
        event.source_name,
        event.summary,
        event.details,
        event.runbook_url,
        toJson(event.links, []),
        toJson(event.tags, []),
        toJson(event.metadata, {}),
        event.occurred_at,
        event.status,
        recordedAt,
        incidentId,
      );
    } else {
      incidentId = this.db.prepare(`
        INSERT INTO incidents (
          project, environment, fingerprint, severity, status, source_type, source_name,
          summary, details, runbook_url, links_json, tags_json, metadata_json,
          first_seen_at, last_seen_at, last_event_status, repeat_count,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        event.project,
        event.environment,
        event.fingerprint,
        event.severity,
        event.source_type,
        event.source_name,
        event.summary,
        event.details,
        event.runbook_url,
        toJson(event.links, []),
        toJson(event.tags, []),
        toJson(event.metadata, {}),
        event.occurred_at,
        event.occurred_at,
        event.status,
        recordedAt,
        recordedAt,
      ).lastInsertRowid;
    }

    this.db.prepare(`
      INSERT INTO events (
        event_id, incident_id, project, environment, fingerprint, severity, status,
        source_type, source_name, summary, details, runbook_url, links_json, tags_json,
        metadata_json, occurred_at, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.event_id,
      incidentId,
      event.project,
      event.environment,
      event.fingerprint,
      event.severity,
      event.status,
      event.source_type,
      event.source_name,
      event.summary,
      event.details,
      event.runbook_url,
      toJson(event.links, []),
      toJson(event.tags, []),
      toJson(event.metadata, {}),
      event.occurred_at,
      recordedAt,
    );

    return {
      event: this.db.prepare(`
        SELECT *
        FROM events
        WHERE event_id = ?
      `).get(event.event_id),
      incident: this.getIncident(incidentId),
    };
  }
}
