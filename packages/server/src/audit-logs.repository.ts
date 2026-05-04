import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

import Database from 'better-sqlite3';

import type { AuditLogInput, AuditLogRecord, AuditLogRepository } from './audit.type.js';
import type { AuditLogRow } from './audit-logs.repository.type.js';
import { recordSchemaMigration } from './schema-migrations.repository.js';

export function createSqliteAuditLogsRepository(databaseFile: string): AuditLogRepository {
  if (databaseFile !== ':memory:') {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');
  database.exec(createSchema());
  recordSchemaMigration(database, { name: '0001_audit_logs_schema_v1', scope: 'audit-logs' });

  return {
    append(input: AuditLogInput): AuditLogRecord {
      const record = makeRecord(input);

      database
        .prepare(
          'INSERT INTO audit_logs (id, action, scope, subject_id, actor_email, actor_role, details_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run(
          record.id,
          record.action,
          record.scope,
          record.subjectId,
          record.actorEmail,
          record.actorRole,
          JSON.stringify(record.details),
        );

      return record;
    },
    clear() {
      database.prepare('DELETE FROM audit_logs').run();
    },
    close() {
      database.close();
    },
    list(): readonly AuditLogRecord[] {
      const rows = database
        .prepare(
          'SELECT id, action, scope, subject_id, actor_email, actor_role, details_json, created_at FROM audit_logs ORDER BY created_at DESC, id DESC',
        )
        .all() as AuditLogRow[];

      return rows.map(mapRow);
    },
    replaceAll(records) {
      database.transaction(() => {
        database.prepare('DELETE FROM audit_logs').run();

        for (const record of records) {
          database
            .prepare('INSERT INTO audit_logs (id, action, scope, subject_id, actor_email, actor_role, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(
              record.id,
              record.action,
              record.scope,
              record.subjectId,
              record.actorEmail,
              record.actorRole,
              JSON.stringify(record.details),
              record.createdAt,
            );
        }
      })();
    },
  };
}

function createSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS audit_logs (',
    '  id TEXT PRIMARY KEY,',
    '  action TEXT NOT NULL,',
    '  scope TEXT NOT NULL,',
    '  subject_id TEXT NOT NULL,',
    '  actor_email TEXT NOT NULL,',
    '  actor_role TEXT NOT NULL,',
    "  details_json TEXT NOT NULL DEFAULT '{}',",
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ');',
  ].join('\n');
}

function mapRow(row: AuditLogRow): AuditLogRecord {
  return {
    action: row.action as AuditLogRecord['action'],
    actorEmail: row.actor_email,
    actorRole: row.actor_role as AuditLogRecord['actorRole'],
    createdAt: row.created_at,
    details: parseDetails(row.details_json),
    id: row.id,
    scope: row.scope as AuditLogRecord['scope'],
    subjectId: row.subject_id,
  };
}

function makeRecord(input: AuditLogInput): AuditLogRecord {
  return {
    ...input,
    createdAt: new Date().toISOString(),
    id: randomUUID(),
  };
}

function parseDetails(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
