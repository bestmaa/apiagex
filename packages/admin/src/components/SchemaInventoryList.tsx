import { Pencil, Trash2 } from "lucide-react";
import type { SchemaRecord } from "../schema.type";
import { StateMessage } from "./StateMessage";

export function SchemaInventoryList({
  onDelete,
  onEdit,
  onSelect,
  schemas,
  selectedId,
}: {
  onDelete: (schema: SchemaRecord) => void;
  onEdit: (schema: SchemaRecord) => void;
  onSelect: (schema: SchemaRecord) => void;
  schemas: SchemaRecord[];
  selectedId: string;
}) {
  if (schemas.length === 0) {
    return (
      <section className="schema-inventory" aria-labelledby="schema-inventory-title">
        <h3 id="schema-inventory-title">Created Schemas</h3>
        <StateMessage title="No schemas yet" variant="empty">
          Create a schema to generate the first API.
        </StateMessage>
      </section>
    );
  }

  return (
    <section className="schema-inventory" aria-labelledby="schema-inventory-title">
      <h3 id="schema-inventory-title">Created Schemas</h3>
      <div className="schema-inventory-list">
        {schemas.map((schema) => {
          const relationCount = schema.fields.filter((field) => field.type === "relation").length;
          const selected = selectedId === schema.id;
          return (
            <article className={selected ? "schema-inventory-row is-selected" : "schema-inventory-row"} key={schema.id}>
              <div className="schema-inventory-main">
                <strong>{schema.name}</strong>
                <code>/api/content/{schema.slug}</code>
              </div>
              <div className="schema-inventory-meta" aria-label={`${schema.name} summary`}>
                <span>{schema.fields.length} fields</span>
                <span>{relationCount} relations</span>
              </div>
              <div className="schema-inventory-actions">
                <button type="button" onClick={() => onSelect(schema)}>
                  {selected ? "Selected" : "View"}
                </button>
                <button type="button" onClick={() => onEdit(schema)}>
                  <Pencil aria-hidden="true" size={16} />
                  Edit
                </button>
                <button className="danger-button" type="button" onClick={() => onDelete(schema)}>
                  <Trash2 aria-hidden="true" size={16} />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
