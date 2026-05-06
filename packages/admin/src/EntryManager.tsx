import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { createEntry, deleteEntry, listEntries, listSchemas, updateEntry } from "./api";
import { StateMessage } from "./components/StateMessage";
import type { EntryData, EntryRecord, EntryFormProps } from "./entry.type";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";

export function EntryManager() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [schemaId, setSchemaId] = useState("");
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [relationEntries, setRelationEntries] = useState<Record<string, EntryRecord[]>>({});
  const [editingEntry, setEditingEntry] = useState<EntryRecord | null>(null);
  const [status, setStatus] = useState("Entry manager loading");
  const schema = schemas.find((item) => item.id === schemaId);

  useEffect(() => {
    void loadSchemas();
  }, []);

  useEffect(() => {
    if (!schema) {
      setRelationEntries({});
      return;
    }
    const relationFields = schema.fields.filter(isEntryPickerRelationField);
    if (relationFields.length === 0) {
      setRelationEntries({});
      return;
    }
    let active = true;
    async function loadRelationEntries() {
      const nextEntries: Record<string, EntryRecord[]> = {};
      for (const field of relationFields) {
        if (!field.relationSchemaId) continue;
        const result = await listEntries(field.relationSchemaId);
        nextEntries[field.slug] = result.entries ?? [];
      }
      if (active) setRelationEntries(nextEntries);
    }
    void loadRelationEntries();
    return () => {
      active = false;
    };
  }, [schema]);

  async function loadSchemas() {
    const result = await listSchemas();
    const nextSchemas = result.schemas ?? [];
    setSchemas(nextSchemas);
    setSchemaId(nextSchemas[0]?.id ?? "");
    setStatus(nextSchemas.length ? "Select a schema to create entries" : "Create a schema first");
    if (nextSchemas[0]) {
      await loadEntries(nextSchemas[0].id);
    }
  }

  async function loadEntries(nextSchemaId = schemaId) {
    if (!nextSchemaId) return;
    const result = await listEntries(nextSchemaId);
    setEntries(result.entries ?? []);
    setStatus(result.ok ? "Entries ready" : result.error ?? "Entries failed");
  }

  async function changeSchema(nextSchemaId: string) {
    setSchemaId(nextSchemaId);
    setEditingEntry(null);
    await loadEntries(nextSchemaId);
  }

  async function removeEntry(entry: EntryRecord) {
    const result = await deleteEntry(entry.schemaId, entry.id);
    if (!result.ok) {
      setStatus(result.error ?? "Entry delete failed");
      return;
    }
    setEditingEntry(null);
    setStatus(`Deleted entry: ${entry.id.slice(0, 8)}`);
    await loadEntries(entry.schemaId);
  }

  return (
    <section aria-labelledby="entry-manager-title">
      <h2 id="entry-manager-title">Entries</h2>
      <p>English: Select a schema, create content, then edit or delete entries.</p>
      <p>Hinglish: Schema select karo, content banao, phir entries edit ya delete karo.</p>
      <EntrySchemaSelector
        entries={entries.length}
        onChange={(nextSchemaId) => void changeSchema(nextSchemaId)}
        schema={schema}
        schemaId={schemaId}
        schemas={schemas}
      />
      {schema ? (
        <GeneratedEntryForm
          editingEntry={editingEntry}
          key={`${schema.id}-${editingEntry?.id ?? "new"}`}
          onCancelEdit={() => setEditingEntry(null)}
          onCreated={() => loadEntries(schema.id)}
          relationEntries={relationEntries}
          schema={schema}
        />
      ) : (
        <StateMessage title="No schema available" variant="empty">Create a schema first.</StateMessage>
      )}
      <StateMessage title="Entry state">{status}</StateMessage>
      {schema ? (
        <EntryList
          entries={entries}
          onDelete={removeEntry}
          onEdit={setEditingEntry}
          relationEntries={relationEntries}
          schema={schema}
        />
      ) : null}
    </section>
  );
}

function EntrySchemaSelector({
  entries,
  onChange,
  schema,
  schemaId,
  schemas,
}: {
  entries: number;
  onChange: (schemaId: string) => void;
  schema?: SchemaRecord;
  schemaId: string;
  schemas: SchemaRecord[];
}) {
  const relationCount = schema?.fields.filter((field) => field.type === "relation").length ?? 0;
  return (
    <section className="entry-selector" aria-labelledby="entry-selector-title">
      <div>
        <h3 id="entry-selector-title">Collection</h3>
        <label>Entry schema
          <select value={schemaId} onChange={(event) => onChange(event.target.value)}>
            {schemas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>
      {schema ? (
        <div className="entry-selector-summary">
          <strong>{schema.name}</strong>
          <code>/api/content/{schema.slug}</code>
          <span>{schema.fields.length} fields</span>
          <span>{relationCount} relations</span>
          <span>{entries} entries</span>
        </div>
      ) : null}
    </section>
  );
}

function GeneratedEntryForm({
  schema,
  editingEntry,
  onCancelEdit,
  onCreated,
  relationEntries,
}: EntryFormProps & { relationEntries: Record<string, EntryRecord[]> }) {
  const [status, setStatus] = useState("");

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = readEntryData(new FormData(form), schema.fields, setStatus);
    if (!data) return;
    const result = editingEntry
      ? await updateEntry(schema.id, editingEntry.id, data)
      : await createEntry(schema.id, data);
    if (!result.ok) {
      setStatus(result.error ?? "Entry save failed");
      return;
    }
    if (!editingEntry) form.reset();
    setStatus(`${editingEntry ? "Updated" : "Created"} entry: ${result.entry?.id.slice(0, 8) ?? schema.slug}`);
    await onCreated();
  }

  return (
    <form className="entry-form" noValidate onSubmit={submitEntry}>
      <h3>{editingEntry ? "Edit entry" : "Create entry"}</h3>
      <div className="entry-form-grid">
        {schema.fields.map((field) => (
          <EntryInput
            data={editingEntry?.data}
            field={field}
            key={field.slug}
            relationEntries={relationEntries[field.slug] ?? []}
          />
        ))}
      </div>
      <div className="entry-form-actions">
        <button type="submit">
          {editingEntry ? <Pencil aria-hidden="true" size={16} /> : <Plus aria-hidden="true" size={16} />}
          {editingEntry ? "Update entry" : "Create entry"}
        </button>
        {editingEntry ? (
          <button type="button" onClick={onCancelEdit}>
            <X aria-hidden="true" size={16} />
            Cancel edit
          </button>
        ) : null}
      </div>
      <StateMessage title="Entry form state">{status || "Entry form ready"}</StateMessage>
    </form>
  );
}

function EntryInput({
  data,
  field,
  relationEntries,
}: {
  data?: EntryData;
  field: SchemaFieldDraft;
  relationEntries: EntryRecord[];
}) {
  const name = field.slug;
  const value = data?.[field.slug];
  const fieldClass = isWideEntryField(field) ? "entry-field entry-field-wide" : "entry-field";
  if (isSingleRelationField(field)) {
    return (
      <label className={fieldClass}>{field.name}
        <select
          defaultValue={formatValue(value)}
          key={`${name}-${formatValue(value)}-${relationEntries.length}`}
          name={name}
          required={field.required}
        >
          <option value="">Select {field.relationTarget?.name ?? "target entry"}</option>
          {relationEntries.map((entry) => (
            <option key={entry.id} value={entry.id}>{entryLabel(entry)}</option>
          ))}
        </select>
      </label>
    );
  }
  if (isMultiRelationField(field)) {
    const selectedValues = Array.isArray(value) ? value.map(String) : [];
    return (
      <label className="entry-field entry-field-wide">{field.name}
        <select
          defaultValue={selectedValues}
          key={`${name}-${selectedValues.join(",")}-${relationEntries.length}`}
          multiple
          name={name}
          required={field.required}
        >
          {relationEntries.map((entry) => (
            <option key={entry.id} value={entry.id}>{entryLabel(entry)}</option>
          ))}
        </select>
        <span className="helper-text">Use Ctrl/Cmd to select more than one entry.</span>
      </label>
    );
  }
  if (field.type === "longText" || field.type === "json") {
    return <label className={fieldClass}>{field.name} <textarea defaultValue={formatValue(value)} name={name} required={field.required} rows={3} /></label>;
  }
  if (field.type === "boolean") {
    return <label className={fieldClass}><input defaultChecked={value === true} name={name} type="checkbox" /> {field.name}</label>;
  }
  const type = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return <label className={fieldClass}>{field.name} <input defaultValue={formatValue(value)} name={name} required={field.required} type={type} /></label>;
}

function EntryList(props: {
  entries: EntryRecord[];
  onDelete: (entry: EntryRecord) => void;
  onEdit: (entry: EntryRecord) => void;
  relationEntries: Record<string, EntryRecord[]>;
  schema: SchemaRecord;
}) {
  const { entries, onDelete, onEdit, relationEntries, schema } = props;
  return (
    <div>
      <h3>Entries</h3>
      {entries.length === 0 ? (
        <StateMessage title="No entries yet" variant="empty">
          Create the first entry for this schema.
        </StateMessage>
      ) : entries.map((entry) => (
        <article className="api-row" key={entry.id}>
          <strong>{entry.id.slice(0, 8)}</strong>
          <ul className="entry-summary-list">
            {entrySummaryItems(entry, schema.fields, relationEntries).map((item) => (
              <li className="entry-summary-item" key={item.slug}>
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onEdit(entry)}>
            <Pencil aria-hidden="true" size={16} />
            Edit
          </button>
          <button type="button" onClick={() => onDelete(entry)}>
            <Trash2 aria-hidden="true" size={16} />
            Delete
          </button>
        </article>
      ))}
    </div>
  );
}

function readEntryData(
  form: FormData,
  fields: SchemaFieldDraft[],
  setStatus: (status: string) => void,
): EntryData | null {
  const data: EntryData = {};
  try {
    for (const field of fields) {
      if (isMultiRelationField(field)) {
        const values = form.getAll(field.slug).map(String).filter(Boolean);
        if (field.required && values.length === 0) {
          setStatus(`ENTRY_FIELD_REQUIRED:${field.slug}`);
          return null;
        }
        if (values.length > 0 || field.required) data[field.slug] = values;
        continue;
      }
      const raw = form.get(field.slug);
      if (field.type === "boolean") {
        data[field.slug] = raw === "on";
      } else if (isSingleRelationField(field) && field.required && (raw === null || raw === "")) {
        setStatus(`ENTRY_FIELD_REQUIRED:${field.slug}`);
        return null;
      } else if (field.required && (raw === null || raw === "")) {
        setStatus(`ENTRY_FIELD_REQUIRED:${field.slug}`);
        return null;
      } else if (raw !== null && raw !== "") {
        data[field.slug] = parseFieldValue(field, String(raw));
      }
    }
  } catch {
    setStatus("JSON_INVALID");
    return null;
  }
  return data;
}

function parseFieldValue(field: SchemaFieldDraft, raw: string): unknown {
  if (field.type === "number") return Number(raw);
  if (field.type === "json") return JSON.parse(raw);
  return raw;
}

function isSingleRelationField(field: SchemaFieldDraft): boolean {
  return field.type === "relation" && (field.relationType === "oneToOne" || field.relationType === "manyToOne");
}

function isMultiRelationField(field: SchemaFieldDraft): boolean {
  return field.type === "relation" && (field.relationType === "oneToMany" || field.relationType === "manyToMany");
}

function isWideEntryField(field: SchemaFieldDraft): boolean {
  return field.type === "longText" || field.type === "json" || field.type === "relation" || field.type === "media";
}

function isEntryPickerRelationField(field: SchemaFieldDraft): boolean {
  return isSingleRelationField(field) || isMultiRelationField(field);
}

function entrySummaryItems(
  entry: EntryRecord,
  fields: SchemaFieldDraft[],
  relationEntries: Record<string, EntryRecord[]>,
): { slug: string; name: string; value: string }[] {
  return fields
    .filter((field) => entry.data[field.slug] !== undefined)
    .map((field) => ({
      slug: field.slug,
      name: field.name,
      value: entrySummaryValue(field, entry.data[field.slug], relationEntries[field.slug] ?? []),
    }));
}

function entrySummaryValue(field: SchemaFieldDraft, value: unknown, relationEntries: EntryRecord[]): string {
  if (isSingleRelationField(field)) {
    return typeof value === "string" && value
      ? relationLabelForId(value, relationEntries)
      : "None";
  }
  if (isMultiRelationField(field)) {
    const ids = Array.isArray(value) ? value.map(String).filter(Boolean) : [];
    if (ids.length === 0) return "0 selected";
    const labels = ids.slice(0, 3).map((id) => relationLabelForId(id, relationEntries));
    const suffix = ids.length > labels.length ? `, +${ids.length - labels.length} more` : "";
    return `${ids.length} selected: ${labels.join(", ")}${suffix}`;
  }
  return formatEntryValue(value);
}

function relationLabelForId(id: string, relationEntries: EntryRecord[]): string {
  const entry = relationEntries.find((item) => item.id === id);
  return entry ? entryLabel(entry) : id.slice(0, 8);
}

function entryLabel(entry: EntryRecord): string {
  const preferredKeys = ["title", "name", "label", "slug"];
  for (const key of preferredKeys) {
    const value = entry.data[key];
    if (isLabelValue(value)) return `${String(value)} (${entry.id.slice(0, 8)})`;
  }
  const firstValue = Object.values(entry.data).find(isLabelValue);
  return firstValue ? `${String(firstValue)} (${entry.id.slice(0, 8)})` : entry.id.slice(0, 8);
}

function isLabelValue(value: unknown): value is string | number {
  return (typeof value === "string" && value.trim() !== "") || typeof value === "number";
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function formatEntryValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Empty";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  return "Object";
}
