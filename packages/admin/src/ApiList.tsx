import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Code2,
  Copy,
  Database,
  FileText,
  Filter,
  KeyRound,
  Plus,
  Search,
  Share2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { listApiRequestLogs, listCustomApiRoutes, listSchemas } from "./api";
import type { AdminRoute } from "./app-route.type";
import type { ApiRequestLogRecord } from "./api-log.type";
import { StateMessage } from "./components/StateMessage";
import { StatusToast } from "./components/StatusToast";
import type { CustomApiRouteRecord } from "./custom-api.type";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";

const contentActions = [
  { label: "List entries", method: "GET", path: "/api/content/:schemaSlug", purpose: "Read collection items" },
  { label: "Create entry", method: "POST", path: "/api/content/:schemaSlug", purpose: "Create one item" },
  { label: "Read entry", method: "GET", path: "/api/content/:schemaSlug/:entryId", purpose: "Read one item" },
  { label: "Update entry", method: "PUT", path: "/api/content/:schemaSlug/:entryId", purpose: "Replace one item" },
  { label: "Delete entry", method: "DELETE", path: "/api/content/:schemaSlug/:entryId", purpose: "Delete one item" },
];

const featureCards = [
  {
    action: "Create Schema API",
    description: "Create a schema and Apiagex exposes content APIs automatically.",
    href: "#schemas",
    icon: Database,
    title: "Schema API",
    tone: "purple",
  },
  {
    action: "Create Custom API",
    description: "Build no-code workflow routes under /api/custom.",
    href: "#settings/workflows",
    icon: Code2,
    title: "Custom API",
    tone: "blue",
  },
  {
    action: "Configure Realtime",
    description: "Enable live WebSocket events for generated content APIs.",
    href: "#settings/realtime",
    icon: Zap,
    title: "Realtime API",
    tone: "green",
  },
  {
    action: "Create Webhook",
    description: "Send signed content-change events to external services.",
    href: "#settings/webhooks",
    icon: Share2,
    title: "Webhook",
    tone: "orange",
  },
] satisfies Array<{
  action: string;
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
  tone: string;
}>;

type ManagedApi =
  | { endpoints: number; id: string; kind: "schema"; name: string; path: string; schema: SchemaRecord; status: "Active"; type: "Schema API" }
  | { endpoints: 1; id: string; kind: "custom"; name: string; path: string; route: CustomApiRouteRecord; status: "Active" | "Inactive"; type: "Custom API" };

export function ApiList({ route = "apis" }: { route?: AdminRoute }) {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [customRoutes, setCustomRoutes] = useState<CustomApiRouteRecord[]>([]);
  const [logs, setLogs] = useState<ApiRequestLogRecord[]>([]);
  const [logFiles, setLogFiles] = useState(0);
  const [logMaxBytes, setLogMaxBytes] = useState(5 * 1024 * 1024);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("API management loading");

  useEffect(() => {
    async function load() {
      const [schemaResult, customResult, logResult] = await Promise.all([
        listSchemas(),
        listCustomApiRoutes(),
        listApiRequestLogs(100),
      ]);
      const nextSchemas = schemaResult.schemas ?? [];
      const nextCustomRoutes = customResult.routes ?? [];
      setSchemas(nextSchemas);
      setCustomRoutes(nextCustomRoutes);
      setLogs(logResult.logs ?? []);
      setLogFiles(logResult.files?.length ?? 0);
      setLogMaxBytes(logResult.maxFileBytes ?? 5 * 1024 * 1024);
      setSelectedId((current) => current || firstApiId(nextSchemas, nextCustomRoutes));
      setStatus(statusText(schemaResult.ok, customResult.ok, logResult.ok, nextSchemas.length, nextCustomRoutes.length));
    }
    void load();
  }, []);

  const apis = useMemo(() => managedApis(schemas, customRoutes), [schemas, customRoutes]);
  const filteredApis = useMemo(() => filterApis(apis, search), [apis, search]);
  const selectedApi = apis.find((api) => api.id === selectedId) ?? filteredApis[0] ?? apis[0];
  const contentLogs = logs.filter((log) => log.kind === "content").length;
  const customLogs = logs.filter((log) => log.kind === "custom").length;

  if (route === "apis/logs") {
    return (
      <ApiManagementFrame status={status}>
        <ApiLogsPanel logs={logs} logFiles={logFiles} maxBytes={logMaxBytes} />
      </ApiManagementFrame>
    );
  }

  if (route === "apis/endpoints") {
    return (
      <ApiManagementFrame status={status}>
        <ApiEndpointCatalog apis={filteredApis} selectedApi={selectedApi} onSelect={setSelectedId} search={search} onSearch={setSearch} />
      </ApiManagementFrame>
    );
  }

  return (
    <ApiManagementFrame status={status}>
      <div className="api-feature-grid">
        {featureCards.map((card) => (
          <FeatureCard key={card.title} {...card} />
        ))}
      </div>

      <div className="api-management-grid">
        <section className="api-table-card" aria-labelledby="your-apis-title">
          <div className="api-card-heading">
            <h3 id="your-apis-title">Your APIs</h3>
            <StatusToast title="API status">{status}</StatusToast>
          </div>
          <ApiToolbar search={search} onSearch={setSearch} />

          {filteredApis.length === 0 ? (
            <StateMessage title="No APIs found" variant="empty">
              Create a schema first. Each schema exposes list, create, read, update, and delete content routes.
            </StateMessage>
          ) : (
            <>
              <div className="table-wrap api-list-table">
                <table>
                  <thead>
                    <tr>
                      <th>API Name</th>
                      <th>Type</th>
                      <th>Endpoint</th>
                      <th>Status</th>
                      <th>Endpoints</th>
                      <th>Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApis.map((api) => (
                      <ApiTableRow api={api} key={api.id} onSelect={setSelectedId} selected={selectedApi?.id === api.id} logs={logs} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="api-table-footer">
                <span>Showing {filteredApis.length} of {apis.length} APIs</span>
                <a className="secondary-action" href="#apis/endpoints">Open endpoints</a>
              </div>
            </>
          )}
        </section>

        <aside className="api-side-rail" aria-label="API overview">
          <section className="api-usage-card">
            <div className="api-card-heading">
              <h3>API Usage Overview</h3>
              <a className="secondary-action" href="#apis/logs">Logs</a>
            </div>
            <div className="api-mini-stat-grid">
              <MiniStat label="Total Requests" trend="JSONL" value={formatNumber(logs.length)} />
              <MiniStat label="Schema APIs" trend="Generated" value={String(schemas.length)} />
              <MiniStat label="Content Logs" trend="Runtime" value={String(contentLogs)} />
              <MiniStat label="Custom Logs" trend="Runtime" value={String(customLogs)} />
            </div>
          </section>
          <ApiQuickLinks />
        </aside>
      </div>

      {selectedApi ? <ApiDetailPanel api={selectedApi} /> : null}
    </ApiManagementFrame>
  );
}

function ApiManagementFrame({ children, status: _status }: { children: ReactNode; status: string }) {
  return (
    <div aria-labelledby="api-list-title" className="api-management-page">
      <div className="api-page-actions">
        <h2 id="api-list-title">API Management</h2>
        <a className="primary-action" href="#schemas">
          <Plus aria-hidden="true" size={18} />
          Create New API
          <ArrowRight aria-hidden="true" size={16} />
        </a>
      </div>
      {children}
    </div>
  );
}

function FeatureCard({
  action,
  description,
  href,
  icon: Icon,
  title,
  tone,
}: {
  action: string;
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
  tone: string;
}) {
  return (
    <section className={`api-feature-card is-${tone}`}>
      <div className="api-feature-icon">
        <Icon aria-hidden="true" size={30} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <a href={href}>
        {action}
        <ArrowRight aria-hidden="true" size={16} />
      </a>
    </section>
  );
}

function ApiToolbar({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return (
    <div className="api-table-toolbar">
      <div className="api-tabs" aria-label="API type filters">
        <a className="is-selected" href="#apis">All</a>
        <a href="#apis/endpoints">Endpoints</a>
        <a href="#settings/api-tokens">API Keys</a>
        <a href="#settings/webhooks">Webhooks</a>
        <a href="#apis/logs">Logs</a>
      </div>
      <div className="api-table-tools">
        <label className="api-search-field">
          <Search aria-hidden="true" size={16} />
          <input onChange={(event) => onSearch(event.target.value)} placeholder="Search APIs..." type="search" value={search} />
        </label>
        <button className="secondary-action" type="button">
          <Filter aria-hidden="true" size={16} />
          Filter
        </button>
      </div>
    </div>
  );
}

function ApiTableRow({
  api,
  logs,
  onSelect,
  selected,
}: {
  api: ManagedApi;
  logs: ApiRequestLogRecord[];
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  return (
    <tr className={selected ? "is-selected" : undefined}>
      <td>
        <button className="api-name-cell api-row-select" onClick={() => onSelect(api.id)} type="button">
          <span className={`api-row-icon is-${api.kind === "schema" ? "purple" : "blue"}`}>
            <Code2 aria-hidden="true" size={18} />
          </span>
          <span>
            <strong>{api.name}</strong>
            <small>{api.kind === "schema" ? `${api.schema.fields.length} fields in schema` : api.route.groupName}</small>
          </span>
        </button>
      </td>
      <td><span className={`api-type-badge is-${api.kind}`}>{api.type}</span></td>
      <td><code>{api.path}</code></td>
      <td><span className={api.status === "Active" ? "api-status is-active" : "api-status"}>{api.status}</span></td>
      <td>{api.endpoints}</td>
      <td>{formatNumber(logs.filter((log) => log.path === api.path || log.path.startsWith(`${api.path}/`)).length)}</td>
    </tr>
  );
}

function ApiDetailPanel({ api }: { api: ManagedApi }) {
  if (api.kind === "custom") {
    return (
      <section className="api-doc-examples api-detail-panel" aria-labelledby="api-detail-title">
        <div className="api-schema-heading">
          <div>
            <h3 id="api-detail-title">{api.name}</h3>
            <CopyableCode label={`${api.name} path`} value={api.path} />
          </div>
          <span>{api.route.method}</span>
        </div>
        <ul className="api-endpoint-list">
          <EndpointListItem method={api.route.method} path={api.path} purpose="Custom workflow or project API route" />
        </ul>
      </section>
    );
  }
  return <ApiExplorerRow schema={api.schema} />;
}

function ApiEndpointCatalog({
  apis,
  onSearch,
  onSelect,
  search,
  selectedApi,
}: {
  apis: ManagedApi[];
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  search: string;
  selectedApi?: ManagedApi;
}) {
  return (
    <div className="api-endpoint-layout">
      <section className="api-table-card">
        <div className="api-card-heading">
          <h3>Endpoints</h3>
          <a className="secondary-action" href="#apis">Back to APIs</a>
        </div>
        <ApiToolbar search={search} onSearch={onSearch} />
        <div className="api-endpoint-stack">
          {apis.map((api) => (
            <button className={selectedApi?.id === api.id ? "api-endpoint-card is-selected" : "api-endpoint-card"} key={api.id} onClick={() => onSelect(api.id)} type="button">
              <strong>{api.name}</strong>
              <code>{api.path}</code>
              <span>{api.type} / {api.endpoints} endpoint{api.endpoints === 1 ? "" : "s"}</span>
            </button>
          ))}
        </div>
      </section>
      <aside className="api-side-rail">
        {selectedApi ? <ApiDetailPanel api={selectedApi} /> : null}
      </aside>
    </div>
  );
}

function ApiLogsPanel({ logs, logFiles, maxBytes }: { logs: ApiRequestLogRecord[]; logFiles: number; maxBytes: number }) {
  return (
    <section className="api-table-card api-log-panel" aria-labelledby="api-log-title">
      <div className="api-card-heading">
        <div>
          <h3 id="api-log-title">Runtime API Logs</h3>
          <p>Stored as rotating JSONL files, not in the database. Bodies and tokens are not recorded.</p>
        </div>
        <span className="api-type-badge is-schema">{logFiles} files / {formatBytes(maxBytes)} each</span>
      </div>
      {logs.length === 0 ? (
        <StateMessage title="No API logs yet" variant="empty">
          Call any content API or custom API. New entries will appear here from JSONL log files.
        </StateMessage>
      ) : (
        <div className="table-wrap api-list-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Kind</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={`${log.timestamp}-${log.requestId}`}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td><span className={`api-type-badge is-${log.kind === "content" ? "schema" : "custom"}`}>{log.kind}</span></td>
                  <td><span className={`api-method api-method-${log.method.toLowerCase()}`}>{log.method}</span></td>
                  <td><code>{log.path}</code></td>
                  <td><span className={log.statusCode >= 400 ? "api-status is-error" : "api-status is-active"}>{log.statusCode}</span></td>
                  <td>{log.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, trend, value }: { label: string; trend: string; value: string }) {
  return (
    <div className="api-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </div>
  );
}

function ApiQuickLinks() {
  return (
    <section className="api-quick-links">
      <h3>Quick Links</h3>
      {[
        ["API Documentation", "View OpenAPI and Swagger settings", "#settings/api-docs", FileText],
        ["API Keys", "Manage role tokens", "#settings/api-tokens", KeyRound],
        ["Webhooks", "Configure signed event delivery", "#settings/webhooks", Share2],
        ["Logs", "View JSONL runtime logs", "#apis/logs", FileText],
      ].map(([label, description, href, Icon]) => {
        const LinkIcon = Icon as LucideIcon;
        return (
          <a href={href as string} key={label as string}>
            <LinkIcon aria-hidden="true" size={16} />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
            <ArrowRight aria-hidden="true" size={15} />
          </a>
        );
      })}
    </section>
  );
}

function ApiExplorerRow({ schema }: { schema: SchemaRecord }) {
  const basePath = `/api/content/${schema.slug}`;
  return (
    <article className="api-doc-examples api-explorer-row">
      <div className="api-schema-heading">
        <div>
          <h3>{schema.name}</h3>
          <CopyableCode label={`${schema.name} base path`} value={basePath} />
        </div>
        <span>{schema.fields.length} fields</span>
      </div>
      <p className="api-rbac-note">Role permissions must allow the action. Content users call <code>POST /api/auth/login-user</code> and send <code>Authorization: Bearer TOKEN</code>; public access works only when the public role allows it.</p>
      <ul className="api-endpoint-list">
        {contentActions.map((action) => (
          <EndpointListItem
            key={action.label}
            method={action.method}
            path={action.path.replace(":schemaSlug", schema.slug)}
            purpose={action.purpose}
          />
        ))}
      </ul>
      <div className="api-example-grid">
        <ApiExample title="Create or update payload" value={{ data: sampleData(schema.fields) }} />
        <ApiExample title="Populate routes" value={populateExamples(schema.slug, schema.fields)} />
        <ApiExample title="Response examples" value={responseExamples(schema)} />
        <ApiExample title="RBAC request hint" value={{ login: "POST /api/auth/login-user", headers: { authorization: "Bearer CONTENT_USER_OR_API_TOKEN" }, blocked: { ok: false, error: "API_PERMISSION_DENIED" } }} />
      </div>
    </article>
  );
}

function EndpointListItem({ method, path, purpose }: { method: string; path: string; purpose: string }) {
  return (
    <li>
      <span className={`api-method api-method-${method.toLowerCase()}`}>{method}</span>
      <CopyableCode label={`${method} ${path}`} value={path} />
      <strong>{purpose}</strong>
    </li>
  );
}

function CopyableCode({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const ok = await copyText(value);
    setCopied(ok);
  }
  return (
    <span className="copyable-code">
      <code>{value}</code>
      <button aria-label={`Copy ${label}`} type="button" onClick={() => void copy()}>
        <Copy aria-hidden="true" size={15} />
      </button>
      {copied ? <small>Copied</small> : null}
    </span>
  );
}

function ApiExample({ title, value }: { title: string; value: unknown }) {
  const serialized = JSON.stringify(value, null, 2);
  return (
    <section className="api-example">
      <div className="api-example-heading">
        <strong>{title}</strong>
        <button aria-label={`Copy ${title}`} type="button" onClick={() => void copyText(serialized)}>
          <Copy aria-hidden="true" size={15} />
        </button>
      </div>
      <pre><code>{serialized}</code></pre>
    </section>
  );
}

function managedApis(schemas: SchemaRecord[], routes: CustomApiRouteRecord[]): ManagedApi[] {
  return [
    ...schemas.map((schema): ManagedApi => ({
      endpoints: contentActions.length,
      id: `schema:${schema.id}`,
      kind: "schema",
      name: schema.name,
      path: `/api/content/${schema.slug}`,
      schema,
      status: "Active",
      type: "Schema API",
    })),
    ...routes.map((route): ManagedApi => ({
      endpoints: 1,
      id: `custom:${route.id}`,
      kind: "custom",
      name: route.name,
      path: route.path,
      route,
      status: route.active ? "Active" : "Inactive",
      type: "Custom API",
    })),
  ];
}

function filterApis(apis: ManagedApi[], search: string): ManagedApi[] {
  const query = search.trim().toLowerCase();
  if (!query) return apis;
  return apis.filter((api) =>
    [api.name, api.path, api.type].some((value) => value.toLowerCase().includes(query)),
  );
}

function firstApiId(schemas: SchemaRecord[], routes: CustomApiRouteRecord[]): string {
  if (schemas[0]) return `schema:${schemas[0].id}`;
  if (routes[0]) return `custom:${routes[0].id}`;
  return "";
}

function statusText(schemaOk: boolean, customOk: boolean, logOk: boolean, schemaCount: number, routeCount: number): string {
  if (!schemaOk || !customOk || !logOk) return "Some API data could not be loaded";
  return `${schemaCount} schema APIs and ${routeCount} custom APIs ready`;
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
  if (field.type === "number" || field.type === "decimal" || field.type === "currency") return 123;
  if (field.type === "integer") return 12;
  if (field.type === "boolean") return true;
  if (field.type === "date") return "2026-05-24";
  if (field.type === "datetime") return "2026-05-24T10:30:00.000Z";
  if (field.type === "time") return "10:30";
  if (field.type === "email") return "owner@example.com";
  if (field.type === "url") return "https://example.com";
  if (field.type === "enum") return field.options?.[0] ?? "active";
  if (field.type === "multiSelect") return field.options?.slice(0, 2) ?? ["featured"];
  if (field.type === "json") return { key: "value" };
  if (field.type === "relation") return isMultiRelation(field) ? [`${field.slug.toUpperCase()}_ENTRY_ID_1`, `${field.slug.toUpperCase()}_ENTRY_ID_2`] : `${field.slug.toUpperCase()}_ENTRY_ID`;
  if (field.type === "media" || field.type === "file" || field.type === "image") return "/uploads/example.png";
  return `Example ${field.name}`;
}

function populateExamples(schemaSlug: string, fields: SchemaFieldDraft[]) {
  const relationFields = fields.filter((field) => field.type === "relation");
  if (relationFields.length === 0) return { note: "No relation fields in this schema" };
  return {
    list: `/api/content/${schemaSlug}?populate=relations`,
    read: `/api/content/${schemaSlug}/ENTRY_ID?populate=relations`,
    aliases: [`/api/content/${schemaSlug}?populate=all`, `/api/content/${schemaSlug}?populate=*`],
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
    data[field.slug] = field.type === "relation"
      ? isMultiRelation(field)
        ? [sampleRelatedEntry(field, 1), sampleRelatedEntry(field, 2)]
        : sampleRelatedEntry(field, 1)
      : sampleValue(field);
    return data;
  }, {});
}

function sampleRelatedEntry(field: SchemaFieldDraft, index: number) {
  return {
    id: `RELATED_ENTRY_ID_${index}`,
    schemaId: field.relationSchemaId ?? "RELATED_SCHEMA_ID",
    data: { title: `${field.relationTarget?.name ?? field.name} ${index}` },
    createdAt: "2026-05-24T00:00:00.000Z",
    updatedAt: "2026-05-24T00:00:00.000Z",
  };
}

function isMultiRelation(field: SchemaFieldDraft): boolean {
  return field.relationType === "oneToMany" || field.relationType === "manyToMany";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}
