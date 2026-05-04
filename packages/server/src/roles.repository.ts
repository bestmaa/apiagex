import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import Database from 'better-sqlite3';

import { recordSchemaMigration } from './schema-migrations.repository.js';
import { DEFAULT_ROLE_PERMISSIONS } from './permissions.js';
import type { RoleInput, RoleRecord, RolePermissions } from './roles.routes.type.js';
import type { RoleRow, RolesRepository } from './roles.repository.type.js';

const BUILT_IN_ROLE_SEEDS = [
  { description: 'Bootstrap owner role', id: 'owner', name: 'Owner', permissions: DEFAULT_ROLE_PERMISSIONS.owner },
  { description: 'Bootstrap admin role', id: 'admin', name: 'Admin', permissions: DEFAULT_ROLE_PERMISSIONS.admin },
  { description: 'Bootstrap editor role', id: 'editor', name: 'Editor', permissions: DEFAULT_ROLE_PERMISSIONS.editor },
  { description: 'Bootstrap viewer role', id: 'viewer', name: 'Viewer', permissions: DEFAULT_ROLE_PERMISSIONS.viewer },
] as const;

export function createSqliteRolesRepository(databaseFile: string): RolesRepository {
  if (databaseFile !== ':memory:') {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const database = new Database(databaseFile);
  database.pragma('journal_mode = WAL');
  database.exec(createSchema());
  seedBuiltInRoles(database);
  recordSchemaMigration(database, { name: '0001_roles_schema_v1', scope: 'roles' });

  return {
    clear() {
      database.transaction(() => {
        database.prepare('DELETE FROM roles').run();
        seedBuiltInRoles(database);
      })();
    },
    close() {
      database.close();
    },
    create(input: RoleInput): RoleRecord {
      const record = normalizeRoleRecord(input);

      database
        .prepare('INSERT INTO roles (id, name, description, permissions_json, built_in, created_at, updated_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        .run(record.id, record.name, record.description, JSON.stringify(record.permissions));

      return record;
    },
    delete(id: string): boolean {
      return database.prepare('DELETE FROM roles WHERE id = ?').run(id).changes > 0;
    },
    get(id: string): RoleRecord | null {
      const row = database
        .prepare('SELECT id, name, description, permissions_json, built_in, created_at, updated_at FROM roles WHERE id = ?')
        .get(id) as RoleRow | undefined;

      return row ? mapRoleRow(row) : null;
    },
    getByName(name: string): RoleRecord | null {
      const row = database
        .prepare('SELECT id, name, description, permissions_json, built_in, created_at, updated_at FROM roles WHERE name = ?')
        .get(name) as RoleRow | undefined;

      return row ? mapRoleRow(row) : null;
    },
    isBuiltIn(id: string): boolean {
      const row = database.prepare('SELECT built_in FROM roles WHERE id = ?').get(id) as { built_in: number } | undefined;

      return row?.built_in === 1;
    },
    list(): readonly RoleRecord[] {
      const rows = database
        .prepare('SELECT id, name, description, permissions_json, built_in, created_at, updated_at FROM roles ORDER BY built_in DESC, name ASC')
        .all() as RoleRow[];

      return rows.map(mapRoleRow);
    },
    replaceAll(records: readonly RoleRecord[]): void {
      database.transaction(() => {
        database.prepare('DELETE FROM roles').run();

        for (const record of records) {
          insertRole(database, record, isBuiltInRoleId(record.id));
        }

        seedBuiltInRoles(database);
      })();
    },
    update(id: string, input: RoleInput): RoleRecord | null {
      const existing = database
        .prepare('SELECT built_in FROM roles WHERE id = ?')
        .get(id) as { built_in: number } | undefined;

      if (!existing) {
        return null;
      }

      const record = normalizeRoleRecord({ ...input, id });

      database
        .prepare('UPDATE roles SET name = ?, description = ?, permissions_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(record.name, record.description, JSON.stringify(record.permissions), id);

      return record;
    },
  };
}

function createSchema(): string {
  return [
    'CREATE TABLE IF NOT EXISTS roles (',
    '  id TEXT PRIMARY KEY,',
    '  name TEXT NOT NULL UNIQUE,',
    '  description TEXT NOT NULL DEFAULT \'\',',
    "  permissions_json TEXT NOT NULL DEFAULT '{}',",
    '  built_in INTEGER NOT NULL DEFAULT 0,',
    '  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ');',
  ].join('\n');
}

function insertRole(database: Database.Database, record: RoleRecord, builtIn: boolean): void {
  database
    .prepare('INSERT INTO roles (id, name, description, permissions_json, built_in, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
    .run(record.id, record.name, record.description, JSON.stringify(record.permissions), builtIn ? 1 : 0);
}

function mapRoleRow(row: RoleRow): RoleRecord {
  return {
    description: row.description,
    id: row.id,
    name: row.name,
    permissions: parsePermissions(row.permissions_json),
  };
}

function normalizeRoleRecord(input: RoleInput): RoleRecord {
  const id = normalizeText(input.id);
  const name = normalizeText(input.name);

  if (!id || !name) {
    throw new Error('Invalid role input');
  }

  return {
    description: typeof input.description === 'string' ? input.description.trim() : '',
    id,
    name,
    permissions: normalizePermissions(input.permissions),
  };
}

function normalizePermissions(value: RolePermissions | undefined): RolePermissions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const permissions: RolePermissions = {};

  for (const [scope, actions] of Object.entries(value)) {
    if (!actions || typeof actions !== 'object' || Array.isArray(actions)) {
      continue;
    }

    const normalizedActions: Record<string, boolean> = {};

    for (const [action, allowed] of Object.entries(actions)) {
      if (typeof allowed === 'boolean') {
        normalizedActions[action] = allowed;
      }
    }

    permissions[scope] = normalizedActions;
  }

  return permissions;
}

function parsePermissions(value: string): RolePermissions {
  try {
    const parsed = JSON.parse(value) as RolePermissions | null;

    return normalizePermissions(parsed ?? undefined);
  } catch {
    return {};
  }
}

function normalizeText(value: string): string {
  return value.trim();
}

function seedBuiltInRoles(database: Database.Database): void {
  for (const seed of BUILT_IN_ROLE_SEEDS) {
    database
      .prepare('INSERT OR IGNORE INTO roles (id, name, description, permissions_json, built_in, created_at, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
      .run(seed.id, seed.name, seed.description, JSON.stringify(seed.permissions));
  }
}

function isBuiltInRoleId(id: string): boolean {
  return BUILT_IN_ROLE_SEEDS.some((seed) => seed.id === id);
}
