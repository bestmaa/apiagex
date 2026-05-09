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
    <aside className="entry-collection-rail" aria-labelledby="entry-collection-title">
      <h3 id="entry-collection-title">Collections</h3>
      <div className="entry-collection-list">
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
              <span>
                <strong>{schema.name}</strong>
                <code>/api/content/{schema.slug}</code>
              </span>
              <span>{schema.fields.length} fields</span>
              <span>{entryCounts[schema.id] ?? 0} entries</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
