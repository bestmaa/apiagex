import { FormEvent, useEffect, useState } from "react";
import { createSchema, listSchemas, updateSchema } from "./api";
import type { FieldType, RelationType, SchemaDraft, SchemaFieldDraft, SchemaRecord } from "./schema.type";

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

const relationTypes: {
  hint: string;
  label: string;
  value: RelationType;
}[] = [
  {
    hint: "English: Stores one target id; another entry cannot reuse the same target. Hinglish: Ek target id store hoti hai; dusri entry same target reuse nahi kar sakti.",
    label: "One to one",
    value: "oneToOne",
  },
  {
    hint: "English: Stores an array of target ids on this entry. Hinglish: Is entry me target ids ka array store hota hai.",
    label: "One to many",
    value: "oneToMany",
  },
  {
    hint: "English: Stores one target id; many entries may point to the same target. Hinglish: Ek target id store hoti hai; many entries same target par point kar sakti hain.",
    label: "Many to one",
    value: "manyToOne",
  },
  {
    hint: "English: Stores an array of target ids for multi-select links. Hinglish: Multi-select links ke liye target ids ka array store hota hai.",
    label: "Many to many",
    value: "manyToMany",
  },
];

const emptyField: SchemaFieldDraft = {
  name: "",
  slug: "",
  type: "text",
  required: false,
};

const emptyDraft: SchemaDraft = {
  name: "",
  slug: "",
  description: "",
  fields: [{ ...emptyField }],
};

export function SchemaBuilder() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [draft, setDraft] = useState<SchemaDraft>({ ...emptyDraft });
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("Schema list loading");

  useEffect(() => {
    void refreshSchemas();
  }, []);

  async function refreshSchemas(successStatus = "Schema list ready") {
    const result = await listSchemas();
    setSchemas(result.schemas ?? []);
    setStatus(result.ok ? successStatus : result.error ?? "Schema list failed");
  }

  async function submitSchema(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...draft, fields: draft.fields.map(cleanField) };
    const result = selectedId ? await updateSchema(selectedId, input) : await createSchema(input);
    if (!result.ok) {
      setStatus(result.error ?? "Schema create failed");
      return;
    }
    const successStatus = `${selectedId ? "Updated" : "Created"} schema: ${result.schema?.slug ?? input.slug}`;
    await refreshSchemas(successStatus);
    if (result.schema) selectSchema(result.schema);
  }

  function resetDraft() {
    setSelectedId("");
    setDraft({ ...emptyDraft, fields: [{ ...emptyField }] });
    setStatus("Ready to create schema");
  }

  function selectSchema(schema: SchemaRecord) {
    setSelectedId(schema.id);
    setDraft({
      name: schema.name,
      slug: schema.slug,
      description: schema.description,
      fields: schema.fields.map((field) => ({
        name: field.name,
        slug: field.slug,
        type: field.type,
        required: field.required,
        relationSchemaId: field.relationSchemaId ?? undefined,
        relationType: field.relationType ?? undefined,
      })),
    });
  }

  function updateField(index: number, patch: Partial<SchemaFieldDraft>) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field),
    }));
  }

  return (
    <section aria-labelledby="schema-builder-title">
      <h2 id="schema-builder-title">Schemas</h2>
      <p>English: Create schemas, edit schema basics, add fields, and connect relation fields safely.</p>
      <p>Hinglish: Schemas banao, basics edit karo, fields add karo, aur relation fields safely connect karo.</p>
      <form onSubmit={submitSchema}>
        <label>Name <input required placeholder="Article" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>Slug <input required pattern="[a-z](?:[a-z0-9]|-)*" placeholder="article" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label>
        <label>Description <textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <div className="field-list">
          {draft.fields.map((field, index) => (
            <SchemaFieldRow
              field={field}
              index={index}
              key={`${field.slug}-${index}`}
              onChange={updateField}
              schemas={schemas}
            />
          ))}
        </div>
        <button type="button" onClick={() => setDraft({ ...draft, fields: [...draft.fields, { ...emptyField }] })}>Add field</button>
        <button type="submit">{selectedId ? "Update schema" : "Create schema"}</button>
        {selectedId ? <button type="button" onClick={resetDraft}>New schema</button> : null}
      </form>
      <p className="status-line">{status}</p>
      <SchemaDetails schema={schemas.find((schema) => schema.id === selectedId)} />
      <SchemaList onSelect={selectSchema} schemas={schemas} selectedId={selectedId} />
    </section>
  );
}

function SchemaFieldRow(props: {
  field: SchemaFieldDraft;
  index: number;
  onChange: (index: number, patch: Partial<SchemaFieldDraft>) => void;
  schemas: SchemaRecord[];
}) {
  const { field, index, onChange, schemas } = props;
  const selectedTarget = schemas.find((schema) => schema.id === field.relationSchemaId);
  const selectedRelation = relationTypes.find((relationType) => relationType.value === (field.relationType ?? "manyToOne"));
  return (
    <fieldset>
      <legend>Field {index + 1}</legend>
      <label>Field name <input required value={field.name} onChange={(event) => onChange(index, { name: event.target.value })} /></label>
      <label>Field slug <input required pattern="[a-z](?:[a-z0-9]|-)*" value={field.slug} onChange={(event) => onChange(index, { slug: event.target.value })} /></label>
      <label>Type <select value={field.type} onChange={(event) => onChange(index, fieldTypePatch(event.target.value as FieldType))}>{fieldTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      {field.type === "relation" ? (
        <>
          <label>Relation type
            <select required value={field.relationType ?? "manyToOne"} onChange={(event) => onChange(index, { relationType: event.target.value as RelationType })}>
              {relationTypes.map((relationType) => (
                <option key={relationType.value} value={relationType.value}>{relationType.label}</option>
              ))}
            </select>
          </label>
          {selectedRelation ? <p className="helper-text">{selectedRelation.hint}</p> : null}
          <label>Relation target
            <select disabled={schemas.length === 0} required value={field.relationSchemaId ?? ""} onChange={(event) => onChange(index, { relationSchemaId: event.target.value })}>
              <option value="">{schemas.length === 0 ? "Create a schema first" : "Select target schema"}</option>
              {schemas.map((schema) => (
                <option key={schema.id} value={schema.id}>{schema.name} /{schema.slug}</option>
              ))}
            </select>
          </label>
          {schemas.length === 0 ? <p className="empty-state">No target schemas available yet.</p> : null}
          {selectedTarget ? <p className="helper-text">Target: {selectedTarget.name} /{selectedTarget.slug}</p> : null}
        </>
      ) : null}
      <label><input checked={field.required} type="checkbox" onChange={(event) => onChange(index, { required: event.target.checked })} /> Required</label>
    </fieldset>
  );
}

function fieldTypePatch(type: FieldType): Partial<SchemaFieldDraft> {
  if (type === "relation") {
    return { relationSchemaId: "", relationType: "manyToOne", type };
  }
  return { relationSchemaId: undefined, relationType: undefined, type };
}

function SchemaDetails({ schema }: { schema?: SchemaRecord }) {
  if (!schema) return <p className="empty-state">Select a schema to inspect fields.</p>;
  return (
    <div className="api-row">
      <strong>{schema.name}</strong>
      <code>/api/content/{schema.slug}</code>
      <span>{schema.fields.length} fields</span>
    </div>
  );
}

function SchemaList(props: {
  onSelect: (schema: SchemaRecord) => void;
  schemas: SchemaRecord[];
  selectedId: string;
}) {
  const { onSelect, schemas, selectedId } = props;
  return (
    <div>
      <h3>Created Schemas</h3>
      {schemas.length === 0 ? <p className="empty-state">No schemas yet</p> : schemas.map((schema) => (
        <article className="schema-row" key={schema.id}>
          <strong>{schema.name}</strong>
          <span>/{schema.slug}</span>
          <button type="button" onClick={() => onSelect(schema)}>
            {selectedId === schema.id ? "Selected" : "Edit"}
          </button>
        </article>
      ))}
    </div>
  );
}

function cleanField(field: SchemaFieldDraft): SchemaFieldDraft {
  return field.type === "relation"
    ? { ...field, relationType: field.relationType ?? "manyToOne" }
    : { ...field, relationSchemaId: undefined, relationType: undefined };
}
