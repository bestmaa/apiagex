import type { SchemaRecord } from "./schema.type";

export function EntryCollectionRail({
  entryCounts,
  onSelect,
  schemaId,
  schemas,
}: {
  entryCounts: Record<string, number>;
  onSelect: (schemaId: string) => void;
  schemaId: string;
  schemas: SchemaRecord[];
}) {
  return (
    <>
      <p className="eyebrow">Entries</p>
      <h2 id="entry-collection-title">Collections</h2>
      <div className="entry-collection-list" aria-labelledby="entry-collection-title">
        {schemas.map((schema) => {
          const active = schema.id === schemaId;
          return (
            <button
              aria-pressed={active}
              className={active ? "entry-collection-button is-active" : "entry-collection-button"}
              key={schema.id}
              type="button"
              onClick={() => onSelect(schema.id)}
            >
              <span className="entry-collection-primary">
                <strong>{schema.name}</strong>
                <code>/api/content/{schema.slug}</code>
              </span>
              <span className="entry-collection-meta">
                <span>{schema.fields.length} fields</span>
                <span>{entryCounts[schema.id] ?? 0} entries</span>
              </span>
            </button>
          );
        })}
        {schemas.length === 0 ? <p className="entry-collection-empty">Create a schema first.</p> : null}
      </div>
    </>
  );
}
