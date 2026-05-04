import { FormEvent, useEffect, useState } from "react";
import { createEntry, listEntries, listSchemas } from "./api";
import type { EntryData, EntryRecord, EntryFormProps } from "./entry.type";
import type { SchemaFieldDraft, SchemaRecord } from "./schema.type";

export function EntryManager() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [schemaId, setSchemaId] = useState("");
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [status, setStatus] = useState("Entry manager loading");
  const schema = schemas.find((item) => item.id === schemaId);

  useEffect(() => {
    void loadSchemas();
  }, []);

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
    await loadEntries(nextSchemaId);
  }

  return (
    <section aria-labelledby="entry-manager-title">
      <h2 id="entry-manager-title">Entry Manager</h2>
      <label>Entry schema
        <select value={schemaId} onChange={(event) => void changeSchema(event.target.value)}>
          {schemas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {schema ? <GeneratedEntryForm schema={schema} onCreated={() => loadEntries(schema.id)} /> : null}
      <p>{status}</p>
      <EntryList entries={entries} />
    </section>
  );
}

function GeneratedEntryForm({ schema, onCreated }: EntryFormProps) {
  const [status, setStatus] = useState("");

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = readEntryData(new FormData(form), schema.fields);
    const result = await createEntry(schema.id, data);
    if (!result.ok) {
      setStatus(result.error ?? "Entry create failed");
      return;
    }
    form.reset();
    setStatus(`Created entry: ${result.entry?.id.slice(0, 8) ?? schema.slug}`);
    await onCreated();
  }

  return (
    <form onSubmit={submitEntry}>
      {schema.fields.map((field) => <EntryInput field={field} key={field.slug} />)}
      <button type="submit">Create entry</button>
      <p>{status}</p>
    </form>
  );
}

function EntryInput({ field }: { field: SchemaFieldDraft }) {
  const name = field.slug;
  if (field.type === "longText" || field.type === "json") {
    return <label>{field.name} <textarea name={name} required={field.required} rows={3} /></label>;
  }
  if (field.type === "boolean") {
    return <label><input name={name} type="checkbox" /> {field.name}</label>;
  }
  const type = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return <label>{field.name} <input name={name} required={field.required} type={type} /></label>;
}

function EntryList({ entries }: { entries: EntryRecord[] }) {
  return (
    <div>
      <h3>Entries</h3>
      {entries.length === 0 ? <p>No entries yet</p> : entries.map((entry) => (
        <article className="schema-row" key={entry.id}>
          <strong>{entry.id.slice(0, 8)}</strong>
          <span>{Object.keys(entry.data).join(", ")}</span>
          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
        </article>
      ))}
    </div>
  );
}

function readEntryData(form: FormData, fields: SchemaFieldDraft[]): EntryData {
  const data: EntryData = {};
  for (const field of fields) {
    const raw = form.get(field.slug);
    if (field.type === "boolean") {
      data[field.slug] = raw === "on";
    } else if (raw !== null && raw !== "") {
      data[field.slug] = parseFieldValue(field, String(raw));
    }
  }
  return data;
}

function parseFieldValue(field: SchemaFieldDraft, raw: string): unknown {
  if (field.type === "number") return Number(raw);
  if (field.type === "json") return JSON.parse(raw);
  return raw;
}
