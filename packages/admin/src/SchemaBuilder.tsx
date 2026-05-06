import { FormEvent, useEffect, useState } from "react";
import { FilePlus, Pencil, Plus } from "lucide-react";
import { createSchema, listEntries, listSchemas, updateSchema } from "./api";
import { SchemaInventoryList } from "./components/SchemaInventoryList";
import { StateMessage } from "./components/StateMessage";
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
  const [selectedEntryCount, setSelectedEntryCount] = useState(0);
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
    setSelectedEntryCount(0);
    setDraft({ ...emptyDraft, fields: [{ ...emptyField }] });
    setStatus("Ready to create schema");
  }

  function selectSchema(schema: SchemaRecord) {
    setSelectedId(schema.id);
    void refreshSelectedEntryCount(schema.id);
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

  async function refreshSelectedEntryCount(schemaId: string) {
    const result = await listEntries(schemaId);
    setSelectedEntryCount(result.entries?.length ?? 0);
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
      <form className="schema-form" onSubmit={submitSchema}>
        <fieldset className="schema-form-section">
          <legend>Schema basics</legend>
          <div className="schema-basics-grid">
            <label>Name <input required placeholder="Article" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Slug <input required pattern="[a-z](?:[a-z0-9]|-)*" placeholder="article" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label>
          </div>
          <label>Description <textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        </fieldset>
        <fieldset className="schema-form-section">
          <legend>Fields</legend>
          <div className="field-list">
            {draft.fields.map((field, index) => (
              <SchemaFieldRow
                field={field}
                index={index}
                key={`${field.slug}-${index}`}
                onChange={updateField}
                selectedEntryCount={selectedEntryCount}
                selectedSchemaId={selectedId}
                schemas={schemas}
              />
            ))}
          </div>
          <button type="button" onClick={() => setDraft({ ...draft, fields: [...draft.fields, { ...emptyField }] })}>
            <Plus aria-hidden="true" size={16} />
            Add field
          </button>
        </fieldset>
        <div className="schema-form-actions">
          <button type="submit">
            {selectedId ? <Pencil aria-hidden="true" size={16} /> : <FilePlus aria-hidden="true" size={16} />}
            {selectedId ? "Update schema" : "Create schema"}
          </button>
          {selectedId ? <button type="button" onClick={resetDraft}>New schema</button> : null}
        </div>
      </form>
      <StateMessage title="Schema state">{status}</StateMessage>
      <SchemaDetails schema={schemas.find((schema) => schema.id === selectedId)} />
      <SchemaInventoryList onSelect={selectSchema} schemas={schemas} selectedId={selectedId} />
    </section>
  );
}

function SchemaFieldRow(props: {
  field: SchemaFieldDraft;
  index: number;
  onChange: (index: number, patch: Partial<SchemaFieldDraft>) => void;
  selectedEntryCount: number;
  selectedSchemaId: string;
  schemas: SchemaRecord[];
}) {
  const { field, index, onChange, schemas, selectedEntryCount, selectedSchemaId } = props;
  const selectedTarget = schemas.find((schema) => schema.id === field.relationSchemaId);
  const selectedRelation = relationTypes.find((relationType) => relationType.value === (field.relationType ?? "manyToOne"));
  const showEditWarning = Boolean(selectedSchemaId && field.type === "relation" && selectedEntryCount > 0);
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
          {schemas.length === 0 ? (
            <StateMessage title="No target schemas available" variant="empty">
              Create another schema before selecting a relation target.
            </StateMessage>
          ) : null}
          {selectedTarget ? <p className="helper-text">Target: {selectedTarget.name} /{selectedTarget.slug}</p> : null}
          {showEditWarning ? (
            <p className="warning-text">
              English: This schema has entries; changing relation type or target may be blocked when saved.
              Hinglish: Is schema me entries hain; relation type ya target change save par block ho sakta hai.
            </p>
          ) : null}
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
  if (!schema) {
    return <StateMessage title="No schema selected" variant="empty">Select a schema to inspect fields.</StateMessage>;
  }
  const relationFields = schema.fields.filter((field) => field.type === "relation");
  return (
    <div className="api-row">
      <strong>{schema.name}</strong>
      <code>/api/content/{schema.slug}</code>
      <span>{schema.fields.length} fields</span>
      {relationFields.length > 0 ? (
        <ul className="relation-detail-list">
          {relationFields.map((field) => (
            <li key={field.slug}>
              <strong>{field.name}</strong>
              <span>{relationLabel(field.relationType)} target: {targetLabel(field)}</span>
            </li>
          ))}
        </ul>
      ) : <span>No relation fields</span>}
    </div>
  );
}

function relationLabel(relationType?: RelationType): string {
  return relationTypes.find((option) => option.value === relationType)?.label ?? "Many to one";
}

function targetLabel(field: SchemaFieldDraft): string {
  if (field.relationTarget) {
    return `${field.relationTarget.name} /${field.relationTarget.slug}`;
  }
  return field.relationSchemaId ?? "Target missing";
}

function cleanField(field: SchemaFieldDraft): SchemaFieldDraft {
  return field.type === "relation"
    ? { ...field, relationType: field.relationType ?? "manyToOne" }
    : { ...field, relationSchemaId: undefined, relationType: undefined };
}
