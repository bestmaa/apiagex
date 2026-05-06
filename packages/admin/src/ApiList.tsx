import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
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
          Create a schema first. Each schema exposes list, create, read, update, and delete content routes.
        </StateMessage>
      ) : schemas.map((schema) => (
        <ApiExplorerRow key={schema.id} schema={schema} />
      ))}
    </section>
  );
}

function ApiExplorerRow({ schema }: { schema: SchemaRecord }) {
  const basePath = `/api/content/${schema.slug}`;
  const [copied, setCopied] = useState("");

  async function copy(label: string, value: string) {
    const ok = await copyText(value);
    setCopied(ok ? `Copied ${label}` : `Copy unavailable for ${label}`);
  }

  return (
    <article className="api-explorer-row">
      <div className="api-schema-heading">
        <div>
          <h3>{schema.name}</h3>
          <CopyableCode label={`${schema.name} base path`} onCopy={() => void copy("base path", basePath)} value={basePath} />
        </div>
        <span>{schema.fields.length} fields</span>
      </div>
      <p className="api-rbac-note">Role permissions must allow the action. Send <code>x-apiagex-role-id: ROLE_ID</code>; blocked requests return <code>API_PERMISSION_DENIED</code>.</p>
      <ul className="api-endpoint-list">
        {actions.map((action) => (
          <li key={action.label}>
            <span className={`api-method api-method-${action.method.toLowerCase()}`}>{action.method}</span>
            <CopyableCode
              label={`${action.label} path`}
              onCopy={() => void copy(`${action.label} path`, action.path.replace(":schemaSlug", schema.slug))}
              value={action.path.replace(":schemaSlug", schema.slug)}
            />
            <strong>{action.label}</strong>
            <p>{action.purpose}</p>
          </li>
        ))}
      </ul>
      <div className="api-example-grid">
        <ApiExample onCopy={copy} title="Create or update payload" value={{ data: sampleData(schema.fields) }} />
        <ApiExample onCopy={copy} title="Populate routes" value={populateExamples(schema.slug, schema.fields)} />
        <ApiExample onCopy={copy} title="Response examples" value={responseExamples(schema)} />
        <ApiExample onCopy={copy} title="RBAC request hint" value={{ headers: { "x-apiagex-role-id": "ROLE_ID" }, blocked: { ok: false, error: "API_PERMISSION_DENIED" } }} />
      </div>
      {copied ? <p className="status-line">{copied}</p> : null}
    </article>
  );
}

function CopyableCode({ label, onCopy, value }: { label: string; onCopy: () => void; value: string }) {
  return (
    <span className="copyable-code">
      <code>{value}</code>
      <button aria-label={`Copy ${label}`} type="button" onClick={onCopy}>
        <Copy aria-hidden="true" size={15} />
      </button>
    </span>
  );
}

function ApiExample({
  onCopy,
  title,
  value,
}: {
  onCopy: (label: string, value: string) => Promise<void>;
  title: string;
  value: unknown;
}) {
  const serialized = JSON.stringify(value, null, 2);
  return (
    <section className="api-example">
      <div className="api-example-heading">
        <strong>{title}</strong>
        <button aria-label={`Copy ${title}`} type="button" onClick={() => void onCopy(title, serialized)}>
          <Copy aria-hidden="true" size={15} />
        </button>
      </div>
      <pre><code>{serialized}</code></pre>
    </section>
  );
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
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
