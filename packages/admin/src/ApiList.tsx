import { useEffect, useState } from "react";
import { listSchemas } from "./api";
import { StateMessage } from "./components/StateMessage";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";

const actions = [
  { label: "List entries", method: "GET", path: "/api/content/:schemaSlug", purpose: "Read collection items" },
  { label: "Create entry", method: "POST", path: "/api/content/:schemaSlug", purpose: "Create one item" },
  { label: "Read entry", method: "GET", path: "/api/content/:schemaSlug/:entryId", purpose: "Read one item" },
  { label: "Update entry", method: "PUT", path: "/api/content/:schemaSlug/:entryId", purpose: "Replace one item" },
  { label: "Delete entry", method: "DELETE", path: "/api/content/:schemaSlug/:entryId", purpose: "Delete one item" },
];

export function ApiList() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [status, setStatus] = useState("API list loading");

  useEffect(() => {
    async function load() {
      const result = await listSchemas();
      setSchemas(result.schemas ?? []);
      setStatus(result.ok ? "Dynamic API list ready" : result.error ?? "API list failed");
    }
    void load();
  }, []);

  return (
    <section aria-labelledby="api-list-title">
      <h2 id="api-list-title">API Explorer</h2>
      <p>English: Inspect generated content endpoints, payloads, role headers, and responses.</p>
      <p>Hinglish: Generated content endpoints, payloads, role headers, aur responses inspect karo.</p>
      <StateMessage title="API state">{status}</StateMessage>
      {schemas.length === 0 ? (
        <StateMessage title="No generated APIs yet" variant="empty">
          Create a schema to expose content API routes.
        </StateMessage>
      ) : schemas.map((schema) => (
        <ApiExplorerRow key={schema.id} schema={schema} />
      ))}
    </section>
  );
}

function ApiExplorerRow({ schema }: { schema: SchemaRecord }) {
  const basePath = `/api/content/${schema.slug}`;
  return (
    <article className="api-explorer-row">
      <div className="api-schema-heading">
        <div>
          <h3>{schema.name}</h3>
          <code>{basePath}</code>
        </div>
        <span>{schema.fields.length} fields</span>
      </div>
      <p className="api-rbac-note">Use <code>x-apiagex-role-id: ROLE_ID</code> for RBAC checks. Missing or blocked permissions return permission errors.</p>
      <ul className="api-endpoint-list">
        {actions.map((action) => (
          <li key={action.label}>
            <span className={`api-method api-method-${action.method.toLowerCase()}`}>{action.method}</span>
            <code>{action.path.replace(":schemaSlug", schema.slug)}</code>
            <strong>{action.label}</strong>
            <p>{action.purpose}</p>
          </li>
        ))}
      </ul>
      <div className="api-example-grid">
        <ApiExample title="Create or update payload" value={{ data: sampleData(schema.fields) }} />
        <ApiExample title="Populate routes" value={populateExamples(schema.slug, schema.fields)} />
        <ApiExample title="Response examples" value={responseExamples(schema)} />
        <ApiExample title="RBAC request hint" value={{ headers: { "x-apiagex-role-id": "ROLE_ID" }, blocked: { ok: false, error: "API_PERMISSION_DENIED" } }} />
      </div>
    </article>
  );
}

function ApiExample({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="api-example">
      <strong>{title}</strong>
      <pre><code>{JSON.stringify(value, null, 2)}</code></pre>
    </section>
  );
}

function sampleData(fields: SchemaFieldDraft[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((data, field) => {
    data[field.slug] = sampleValue(field);
    return data;
  }, {});
}

function sampleValue(field: SchemaFieldDraft): unknown {
  if (field.type === "number") return 123;
  if (field.type === "boolean") return true;
  if (field.type === "date") return "2026-05-05";
  if (field.type === "json") return { key: "value" };
  if (field.type === "relation") return isMultiRelation(field) ? [`${field.slug.toUpperCase()}_ENTRY_ID_1`, `${field.slug.toUpperCase()}_ENTRY_ID_2`] : `${field.slug.toUpperCase()}_ENTRY_ID`;
  if (field.type === "media") return "/uploads/example.png";
  return `Example ${field.name}`;
}

function populateExamples(schemaSlug: string, fields: SchemaFieldDraft[]) {
  const relationFields = fields.filter((field) => field.type === "relation");
  if (relationFields.length === 0) {
    return { note: "No relation fields in this schema" };
  }
  return {
    list: `/api/content/${schemaSlug}?populate=relations`,
    read: `/api/content/${schemaSlug}/ENTRY_ID?populate=relations`,
    aliases: [
      `/api/content/${schemaSlug}?populate=all`,
      `/api/content/${schemaSlug}?populate=*`,
    ],
  };
}

function responseExamples(schema: SchemaRecord) {
  return {
    list: { ok: true, schema: schema.slug, entries: [] },
    mutation: { ok: true, entry: { id: "ENTRY_ID", data: sampleData(schema.fields) } },
    populated: { ok: true, entry: { id: "ENTRY_ID", data: populatedData(schema.fields) } },
    blocked: { ok: false, error: "API_PERMISSION_DENIED" },
  };
}

function populatedData(fields: SchemaFieldDraft[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((data, field) => {
    if (field.type === "relation") {
      data[field.slug] = isMultiRelation(field)
        ? [sampleRelatedEntry(field, 1), sampleRelatedEntry(field, 2)]
        : sampleRelatedEntry(field, 1);
      return data;
    }
    data[field.slug] = sampleValue(field);
    return data;
  }, {});
}

function sampleRelatedEntry(field: SchemaFieldDraft, index: number) {
  return {
    id: `RELATED_ENTRY_ID_${index}`,
    schemaId: field.relationSchemaId ?? "RELATED_SCHEMA_ID",
    data: { title: `${field.relationTarget?.name ?? field.name} ${index}` },
    createdAt: "2026-05-06T00:00:00.000Z",
    updatedAt: "2026-05-06T00:00:00.000Z",
  };
}

function isMultiRelation(field: SchemaFieldDraft): boolean {
  return field.relationType === "oneToMany" || field.relationType === "manyToMany";
}
