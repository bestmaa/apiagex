import { FormEvent, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { createEntry, updateEntry } from "./api";
import {
  entryLabel,
  formatValue,
  isMultiRelationField,
  isSingleRelationField,
  isWideEntryField,
  readEntryData,
  relationKindLabel,
} from "./entry-display";
import { StatusToast } from "./components/StatusToast";
import { StateMessage } from "./components/StateMessage";
import type { EntryData, EntryFormProps, EntryRecord } from "./entry.type";
import type { SchemaFieldDraft } from "./schema.type";

export function GeneratedEntryForm({
  schema,
  editingEntry,
  onCancelEdit,
  onCancelCreate,
  onCreated,
  relationEntries,
}: EntryFormProps & {
  onCancelCreate?: () => void;
  relationEntries: Record<string, EntryRecord[]>;
}) {
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
        ) : onCancelCreate ? (
          <button type="button" onClick={onCancelCreate}>
            <X aria-hidden="true" size={16} />
            Close form
          </button>
        ) : null}
      </div>
      <StatusToast title="Entry form status">{status || "Entry form ready"}</StatusToast>
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
  const value = data?.[field.slug];
  const fieldClass = isWideEntryField(field) ? "entry-field entry-field-wide" : "entry-field";
  if (isSingleRelationField(field)) {
    return (
      <div className="entry-field entry-field-wide relation-picker">
        <RelationPickerHeader field={field} selectedCount={formatValue(value) ? 1 : 0} total={relationEntries.length} />
        <label>{field.name}
          <select defaultValue={formatValue(value)} name={field.slug} required={field.required}>
            <option value="">Select {field.relationTarget?.name ?? "target entry"}</option>
            {relationEntries.map((entry) => <option key={entry.id} value={entry.id}>{entryLabel(entry)}</option>)}
          </select>
        </label>
        {relationEntries.length === 0 ? <StateMessage title="No target entries" variant="empty">Create entries in the target schema first.</StateMessage> : null}
      </div>
    );
  }
  if (isMultiRelationField(field)) {
    const selectedValues = Array.isArray(value) ? value.map(String) : [];
    return (
      <div className="entry-field entry-field-wide relation-picker">
        <RelationPickerHeader field={field} selectedCount={selectedValues.length} total={relationEntries.length} />
        <label>{field.name}
          <select defaultValue={selectedValues} multiple name={field.slug} required={field.required}>
            {relationEntries.map((entry) => <option key={entry.id} value={entry.id}>{entryLabel(entry)}</option>)}
          </select>
        </label>
        <span className="helper-text">Use Ctrl/Cmd to select more than one entry. Saved value stays an array of entry ids.</span>
        {relationEntries.length === 0 ? <StateMessage title="No target entries" variant="empty">Create entries in the target schema first.</StateMessage> : null}
      </div>
    );
  }
  if (field.type === "longText" || field.type === "json") {
    return <label className={fieldClass}>{field.name} <textarea defaultValue={formatValue(value)} name={field.slug} required={field.required} rows={3} /></label>;
  }
  if (field.type === "boolean") {
    return <label className={fieldClass}><input defaultChecked={value === true} name={field.slug} type="checkbox" /> {field.name}</label>;
  }
  const type = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return <label className={fieldClass}>{field.name} <input defaultValue={formatValue(value)} name={field.slug} required={field.required} type={type} /></label>;
}

function RelationPickerHeader({ field, selectedCount, total }: {
  field: SchemaFieldDraft;
  selectedCount: number;
  total: number;
}) {
  return (
    <div className="relation-picker-header">
      <div>
        <strong>{field.relationTarget?.name ?? "Target schema"}</strong>
        <span>{relationKindLabel(field)} relation</span>
      </div>
      <div className="relation-picker-counts">
        <span>{total} available</span>
        <span>{selectedCount} selected</span>
      </div>
    </div>
  );
}
