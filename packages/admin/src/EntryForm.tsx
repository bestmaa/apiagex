import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Upload, X } from "lucide-react";
import { createEntry, fileToMediaUpload, updateEntry } from "./api";
import {
  entryLabel,
  formatValue,
  isMultiRelationField,
  isSingleRelationField,
  isUploadField,
  isWideEntryField,
  readEntryData,
  relationKindLabel,
} from "./entry-display";
import { StatusToast } from "./components/StatusToast";
import { StateMessage } from "./components/StateMessage";
import type { EntryData, EntryFormProps, EntryMediaUploads, EntryRecord } from "./entry.type";
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
  const [formNonce, setFormNonce] = useState(0);

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const mediaUploads = await collectMediaUploads(form, schema.fields, setStatus);
    if (!mediaUploads) return;
    const data = readEntryData(formData, schema.fields, setStatus, new Set(Object.keys(mediaUploads)));
    if (!data) return;
    const result = editingEntry
      ? await updateEntry(schema.id, editingEntry.id, data, mediaUploads)
      : await createEntry(schema.id, data, mediaUploads);
    if (!result.ok) {
      setStatus(result.error ?? "Entry save failed");
      return;
    }
    if (!editingEntry) {
      form.reset();
      setFormNonce((current) => current + 1);
    }
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
            onStatus={setStatus}
            relationEntries={relationEntries[field.slug] ?? []}
            resetKey={formNonce}
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
  onStatus,
  relationEntries,
  resetKey,
}: {
  data?: EntryData;
  field: SchemaFieldDraft;
  onStatus: (status: string) => void;
  relationEntries: EntryRecord[];
  resetKey: number;
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
  if (field.type === "longText" || field.type === "richText" || field.type === "json") {
    const rows = field.type === "richText" ? 6 : 3;
    return <label className={fieldClass}>{field.name} <textarea defaultValue={formatValue(value)} name={field.slug} required={field.required} rows={rows} /></label>;
  }
  if (field.type === "boolean") {
    return <label className={fieldClass}><input defaultChecked={value === true} name={field.slug} type="checkbox" /> {field.name}</label>;
  }
  if (field.type === "enum") {
    return (
      <label className={fieldClass}>{field.name}
        <select defaultValue={formatValue(value)} name={field.slug} required={field.required}>
          <option value="">Select {field.name}</option>
          {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === "multiSelect") {
    const selectedValues = Array.isArray(value) ? value.map(String) : [];
    return (
      <label className={fieldClass}>{field.name}
        <select defaultValue={selectedValues} multiple name={field.slug} required={field.required}>
          {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (isUploadField(field)) {
    return <MediaInput field={field} onStatus={onStatus} resetKey={resetKey} value={formatValue(value)} />;
  }
  return (
    <label className={fieldClass}>{field.name}
      <input
        defaultValue={formatValue(value)}
        name={field.slug}
        required={field.required}
        step={inputStep(field.type)}
        type={inputType(field.type)}
      />
    </label>
  );
}

function MediaInput({
  field,
  onStatus,
  resetKey,
  value,
}: {
  field: SchemaFieldDraft;
  onStatus: (status: string) => void;
  resetKey: number;
  value: string;
}) {
  const [url, setUrl] = useState(value);
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    setUrl(value);
    setSelectedName("");
  }, [resetKey, value]);

  async function uploadFile(file: File | undefined) {
    setSelectedName(file?.name ?? "");
    onStatus(file ? `Selected media: ${file.name}` : "Media selection cleared");
  }

  return (
    <div className="entry-field entry-field-wide media-picker">
      <label>{field.name}
        <input
          name={field.slug}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="/uploads/example.png"
          required={field.required}
          type="text"
          value={url}
        />
      </label>
      <label className="media-upload-button">
        <Upload aria-hidden="true" size={16} />
        <span>{selectedName || "Upload"}</span>
        <input
          accept={mediaAccept(field.type)}
          onChange={(event) => void uploadFile(event.target.files?.[0])}
          name={`__apiagex_media_${field.slug}`}
          type="file"
        />
      </label>
    </div>
  );
}

async function collectMediaUploads(
  form: HTMLFormElement,
  fields: SchemaFieldDraft[],
  setStatus: (status: string) => void,
): Promise<EntryMediaUploads | null> {
  const uploads: EntryMediaUploads = {};
  try {
    for (const field of fields) {
      if (!isUploadField(field)) continue;
      const input = form.elements.namedItem(`__apiagex_media_${field.slug}`);
      const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
      if (!file || file.size === 0) continue;
      setStatus(`Preparing media: ${file.name}`);
      uploads[field.slug] = await fileToMediaUpload(file);
    }
  } catch {
    setStatus("MEDIA_UPLOAD_PREPARE_FAILED");
    return null;
  }
  return uploads;
}

function inputType(type: SchemaFieldDraft["type"]): string {
  if (type === "email") return "email";
  if (type === "url") return "url";
  if (type === "integer" || type === "decimal" || type === "currency" || type === "number") return "number";
  if (type === "date") return "date";
  if (type === "datetime") return "datetime-local";
  if (type === "time") return "time";
  if (type === "password") return "password";
  return "text";
}

function inputStep(type: SchemaFieldDraft["type"]): string | undefined {
  if (type === "integer") return "1";
  if (type === "decimal" || type === "currency") return "0.01";
  return undefined;
}

function mediaAccept(type: SchemaFieldDraft["type"]): string {
  if (type === "image") return "image/png,image/jpeg,image/gif,image/webp";
  return "image/png,image/jpeg,image/gif,image/webp,application/pdf";
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
