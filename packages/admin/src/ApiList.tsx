import { useEffect, useState } from "react";
import { listSchemas } from "./api";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";

const actions = [
  { label: "List entries", method: "GET", path: "/api/content/:schemaSlug" },
  { label: "Create entry", method: "POST", path: "/api/content/:schemaSlug" },
  { label: "Read entry", method: "GET", path: "/api/content/:schemaSlug/:entryId" },
  { label: "Update entry", method: "PUT", path: "/api/content/:schemaSlug/:entryId" },
  { label: "Delete entry", method: "DELETE", path: "/api/content/:schemaSlug/:entryId" },
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
      <p className="status-line">{status}</p>
      {schemas.length === 0 ? <p className="empty-state">No generated APIs yet</p> : schemas.map((schema) => (
        <ApiExplorerRow key={schema.id} schema={schema} />
      ))}
    </section>
  );
}

function ApiExplorerRow({ schema }: { schema: SchemaRecord }) {
  const basePath = `/api/content/${schema.slug}`;
  return (
    <article className="api-row">
      <h3>{schema.name}</h3>
      <code>{basePath}</code>
      <ul>
        {actions.map((action) => (
          <li key={action.label}>
            {action.method} {action.path.replace(":schemaSlug", schema.slug)}
          </li>
        ))}
      </ul>
      <strong>Role header</strong>
      <code>x-apiagex-role-id: ROLE_ID</code>
      <strong>Payload</strong>
      <pre><code>{JSON.stringify({ data: sampleData(schema.fields) }, null, 2)}</code></pre>
      <strong>Response examples</strong>
      <pre><code>{JSON.stringify(responseExamples(schema.slug), null, 2)}</code></pre>
    </article>
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
  if (field.type === "relation") return "RELATED_ENTRY_ID";
  if (field.type === "media") return "/uploads/example.png";
  return `Example ${field.name}`;
}

function responseExamples(schemaSlug: string) {
  return {
    list: { ok: true, schema: schemaSlug, entries: [] },
    mutation: { ok: true, entry: { id: "ENTRY_ID", data: {} } },
    blocked: { ok: false, error: "API_PERMISSION_DENIED" },
  };
}
