import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ApiagexDatabase, DatabaseQueryParam } from "@apiagex/database";
import type { ProjectTemplate, ProjectTemplateImportResponse, ProjectTemplateRow } from "./project-template-routes.type.js";

type TemplateTableKey = keyof ProjectTemplate["tables"];

type TableSpec = {
  columns: string[];
  key: TemplateTableKey;
  name: string;
  select: string;
};

const tableSpecs: TableSpec[] = [
  {
    columns: ["id", "name", "description", "is_owner", "role_kind", "created_at", "updated_at"],
    key: "roles",
    name: "roles",
    select: "SELECT id, name, description, is_owner, role_kind, created_at, updated_at FROM roles WHERE is_owner = 0 ORDER BY created_at ASC",
  },
  {
    columns: ["id", "name", "slug", "description", "created_at", "updated_at"],
    key: "schemas",
    name: "schemas",
    select: "SELECT id, name, slug, description, created_at, updated_at FROM schemas ORDER BY created_at ASC",
  },
  {
    columns: ["id", "schema_id", "name", "slug", "type", "relation_schema_id", "relation_type", "required", "position"],
    key: "fields",
    name: "fields",
    select: "SELECT id, schema_id, name, slug, type, relation_schema_id, relation_type, required, position FROM fields ORDER BY schema_id ASC, position ASC",
  },
  {
    columns: ["id", "value_json", "updated_at"],
    key: "appSettings",
    name: "app_settings",
    select: "SELECT id, value_json, updated_at FROM app_settings ORDER BY id ASC",
  },
  {
    columns: ["id", "name", "description", "method", "path", "active", "definition_json", "created_at", "updated_at", "created_by_id", "created_by_email", "updated_by_id", "updated_by_email", "last_run_at", "version"],
    key: "workflows",
    name: "workflows",
    select: "SELECT id, name, description, method, path, active, definition_json, created_at, updated_at, created_by_id, created_by_email, updated_by_id, updated_by_email, last_run_at, version FROM workflows ORDER BY name ASC",
  },
  {
    columns: ["id", "method", "path", "name", "group_name", "permission_key", "active", "created_at", "updated_at", "last_seen_at"],
    key: "customApiRoutes",
    name: "custom_api_routes",
    select: "SELECT id, method, path, name, group_name, permission_key, active, created_at, updated_at, last_seen_at FROM custom_api_routes ORDER BY group_name ASC, path ASC, method ASC",
  },
  {
    columns: ["id", "role_id", "schema_id", "action", "allowed"],
    key: "permissions",
    name: "permissions",
    select: "SELECT id, role_id, schema_id, action, allowed FROM permissions ORDER BY role_id ASC, schema_id ASC, action ASC",
  },
  {
    columns: ["id", "role_id", "action", "allowed"],
    key: "adminPermissions",
    name: "admin_permissions",
    select: "SELECT id, role_id, action, allowed FROM admin_permissions ORDER BY role_id ASC, action ASC",
  },
  {
    columns: ["schema_id", "enabled", "events_json", "created_at", "updated_at"],
    key: "realtimeConfigs",
    name: "realtime_configs",
    select: "SELECT schema_id, enabled, events_json, created_at, updated_at FROM realtime_configs ORDER BY schema_id ASC",
  },
  {
    columns: ["id", "name", "url", "secret", "events_json", "schema_id", "active", "created_at", "updated_at"],
    key: "webhooks",
    name: "webhooks",
    select: "SELECT id, name, url, NULL as secret, events_json, schema_id, active, created_at, updated_at FROM webhooks ORDER BY created_at ASC",
  },
  {
    columns: ["id", "role_id", "custom_api_route_id", "allowed"],
    key: "customApiPermissions",
    name: "custom_api_permissions",
    select: "SELECT id, role_id, custom_api_route_id, allowed FROM custom_api_permissions ORDER BY role_id ASC, custom_api_route_id ASC",
  },
];

export function registerProjectTemplateRoutes(server: FastifyInstance, database: ApiagexDatabase): void {
  server.get("/api/admin/project-template", async (_request, reply) => {
    const template = await exportProjectTemplate(database);
    return reply
      .header("content-disposition", `attachment; filename="apiagex-template-${new Date().toISOString().slice(0, 10)}.json"`)
      .send({ ok: true, template });
  });

  server.post<{ Body: { template?: unknown } }>("/api/admin/project-template/import", async (request, reply) => {
    try {
      return await importProjectTemplate(database, request.body.template);
    } catch (error) {
      return sendTemplateError(reply, error);
    }
  });
}

async function exportProjectTemplate(database: ApiagexDatabase): Promise<ProjectTemplate> {
  const tables = emptyTables();
  for (const spec of tableSpecs) {
    tables[spec.key] = await database.prepare(spec.select).all<ProjectTemplateRow>();
  }
  return {
    exportedAt: new Date().toISOString(),
    kind: "apiagex.project-template",
    tables,
    version: 1,
  };
}

async function importProjectTemplate(
  database: ApiagexDatabase,
  value: unknown,
): Promise<ProjectTemplateImportResponse> {
  const template = assertProjectTemplate(value);
  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  await database.transaction(async () => {
    for (const spec of tableSpecs) {
      imported[spec.key] = 0;
      skipped[spec.key] = 0;
      const rows = template.tables[spec.key] ?? [];
      for (const row of rows) {
        if (await rowExists(database, spec.name, row)) {
          skipped[spec.key] = (skipped[spec.key] ?? 0) + 1;
          continue;
        }
        await insertRow(database, spec, normalizeRowForImport(spec, row));
        imported[spec.key] = (imported[spec.key] ?? 0) + 1;
      }
    }
  });
  return { ok: true, imported, skipped };
}

function assertProjectTemplate(value: unknown): ProjectTemplate {
  if (!isRecord(value)) throw new Error("PROJECT_TEMPLATE_INVALID");
  if (value.kind !== "apiagex.project-template" || value.version !== 1 || !isRecord(value.tables)) {
    throw new Error("PROJECT_TEMPLATE_UNSUPPORTED");
  }
  const tables = value.tables as Record<string, unknown>;
  for (const spec of tableSpecs) {
    if (!Array.isArray(tables[spec.key])) throw new Error(`PROJECT_TEMPLATE_TABLE_INVALID:${spec.key}`);
  }
  return value as ProjectTemplate;
}

async function rowExists(database: ApiagexDatabase, tableName: string, row: ProjectTemplateRow): Promise<boolean> {
  const primaryColumn = tableName === "realtime_configs" ? "schema_id" : "id";
  const primaryValue = row[primaryColumn];
  if (typeof primaryValue !== "string" || !primaryValue) throw new Error(`PROJECT_TEMPLATE_ROW_ID_INVALID:${tableName}`);
  const found = await database.prepare(`SELECT ${primaryColumn} FROM ${tableName} WHERE ${primaryColumn} = ?`)
    .get<Record<string, string>>(primaryValue);
  return Boolean(found);
}

async function insertRow(database: ApiagexDatabase, spec: TableSpec, row: ProjectTemplateRow): Promise<void> {
  const placeholders = spec.columns.map(() => "?").join(", ");
  const values = spec.columns.map((column) => toDatabaseParam(row[column]));
  await database.prepare(`INSERT INTO ${spec.name} (${spec.columns.join(", ")}) VALUES (${placeholders})`).run(...values);
}

function normalizeRowForImport(spec: TableSpec, row: ProjectTemplateRow): ProjectTemplateRow {
  if (spec.key !== "webhooks") return row;
  return { ...row, secret: randomUUID() };
}

function toDatabaseParam(value: ProjectTemplateRow[string] | undefined): DatabaseQueryParam {
  if (typeof value === "string" || typeof value === "number" || value === null) return value;
  return null;
}

function emptyTables(): ProjectTemplate["tables"] {
  return {
    adminPermissions: [],
    appSettings: [],
    customApiPermissions: [],
    customApiRoutes: [],
    fields: [],
    permissions: [],
    realtimeConfigs: [],
    roles: [],
    schemas: [],
    webhooks: [],
    workflows: [],
  };
}

function sendTemplateError(reply: FastifyReply, error: unknown): FastifyReply {
  const message = error instanceof Error ? error.message : "PROJECT_TEMPLATE_REQUEST_FAILED";
  return reply.code(400).send({ ok: false, error: message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
