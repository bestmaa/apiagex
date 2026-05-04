import { FormEvent, useEffect, useState } from "react";
import { createSchema, listSchemas } from "./api";
import type { FieldType, SchemaDraft, SchemaFieldDraft, SchemaRecord } from "./schema.type";

const fieldTypes: FieldType[] = [
  "text",
  "longText",
  "number",
  "boolean",
  "date",
  "json",
  "media",
  "relation",
];

const emptyField: SchemaFieldDraft = {
  name: "",
  slug: "",
  type: "text",
  required: false,
};

export function SchemaBuilder() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [status, setStatus] = useState("Schema list loading");
  const [fields, setFields] = useState<SchemaFieldDraft[]>([{ ...emptyField }]);

  useEffect(() => {
    void refreshSchemas();
  }, []);

  async function refreshSchemas() {
    const result = await listSchemas();
    setSchemas(result.schemas ?? []);
    setStatus(result.ok ? "Schema list ready" : result.error ?? "Schema list failed");
  }

  async function submitSchema(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: SchemaDraft = {
      name: String(data.get("name") ?? ""),
      slug: String(data.get("slug") ?? ""),
      description: String(data.get("description") ?? ""),
      fields: fields.map(cleanField),
    };
    const result = await createSchema(input);
    if (!result.ok) {
      setStatus(result.error ?? "Schema create failed");
      return;
    }
    form.reset();
    setFields([{ ...emptyField }]);
    setStatus(`Created schema: ${result.schema?.slug ?? input.slug}`);
    await refreshSchemas();
  }

  function updateField(index: number, patch: Partial<SchemaFieldDraft>) {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    );
  }

  return (
    <section aria-labelledby="schema-builder-title">
      <h2 id="schema-builder-title">Schema Builder</h2>
      <form onSubmit={submitSchema}>
        <label>Name <input name="name" required placeholder="Article" /></label>
        <label>Slug <input name="slug" required pattern="[a-z][a-z0-9-]*" placeholder="article" /></label>
        <label>Description <textarea name="description" rows={3} /></label>
        <div className="field-list">
          {fields.map((field, index) => (
            <SchemaFieldRow field={field} index={index} key={index} onChange={updateField} />
          ))}
        </div>
        <button type="button" onClick={() => setFields([...fields, { ...emptyField }])}>Add field</button>
        <button type="submit">Create schema</button>
      </form>
      <p>{status}</p>
      <SchemaList schemas={schemas} />
    </section>
  );
}

function SchemaFieldRow(props: {
  field: SchemaFieldDraft;
  index: number;
  onChange: (index: number, patch: Partial<SchemaFieldDraft>) => void;
}) {
  const { field, index, onChange } = props;
  return (
    <fieldset>
      <legend>Field {index + 1}</legend>
      <label>Field name <input required value={field.name} onChange={(event) => onChange(index, { name: event.target.value })} /></label>
      <label>Field slug <input required pattern="[a-z][a-z0-9-]*" value={field.slug} onChange={(event) => onChange(index, { slug: event.target.value })} /></label>
      <label>Type <select value={field.type} onChange={(event) => onChange(index, { type: event.target.value as FieldType })}>{fieldTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label><input checked={field.required} type="checkbox" onChange={(event) => onChange(index, { required: event.target.checked })} /> Required</label>
    </fieldset>
  );
}

function SchemaList({ schemas }: { schemas: SchemaRecord[] }) {
  return (
    <div>
      <h3>Created Schemas</h3>
      {schemas.length === 0 ? <p>No schemas yet</p> : schemas.map((schema) => (
        <article className="schema-row" key={schema.id}>
          <strong>{schema.name}</strong>
          <span>/{schema.slug}</span>
          <span>{schema.fields.length} fields</span>
        </article>
      ))}
    </div>
  );
}

function cleanField(field: SchemaFieldDraft): SchemaFieldDraft {
  return field.type === "relation" ? field : { ...field, relationSchemaId: undefined };
}
