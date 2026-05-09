import type { SchemaRecord } from "./schema.type";

export function EntryQueryGuide({
  schema,
  visibleFields,
}: {
  schema: SchemaRecord;
  visibleFields: string[];
}) {
  const firstField = visibleFields[0] ?? schema.fields[0]?.slug ?? "field";
  const selectedFields = visibleFields.length ? visibleFields.join(",") : firstField;
  const listPath = `/api/content/${schema.slug}`;
  const adminPath = `/api/admin/schemas/${schema.id}/entries`;
  return (
    <aside className="entry-query-guide" aria-labelledby="entry-query-guide-title">
      <h3 id="entry-query-guide-title">API query params</h3>
      <dl>
        <div>
          <dt>Selected fields</dt>
          <dd><code>?fields={selectedFields}</code></dd>
        </div>
        <div>
          <dt>One field only</dt>
          <dd><code>{listPath}?fields={firstField}</code></dd>
        </div>
        <div>
          <dt>Search</dt>
          <dd><code>{listPath}?search=keyword</code></dd>
        </div>
        <div>
          <dt>Pagination</dt>
          <dd><code>{listPath}?limit=50&amp;offset=0</code></dd>
        </div>
      </dl>
      <p>Admin list endpoint bhi same params use karta hai: <code>{adminPath}?fields={firstField}&amp;search=keyword&amp;limit=50&amp;offset=0</code></p>
    </aside>
  );
}
