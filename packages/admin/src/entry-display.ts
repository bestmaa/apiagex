import type { EntryData, EntryRecord } from "./entry.type";
import type { SchemaFieldDraft } from "./schema.type";

export function isSingleRelationField(field: SchemaFieldDraft): boolean {
  return field.type === "relation" && (field.relationType === "oneToOne" || field.relationType === "manyToOne");
}

export function isMultiRelationField(field: SchemaFieldDraft): boolean {
  return field.type === "relation" && (field.relationType === "oneToMany" || field.relationType === "manyToMany");
}

export function isEntryPickerRelationField(field: SchemaFieldDraft): boolean {
  return isSingleRelationField(field) || isMultiRelationField(field);
}

export function isWideEntryField(field: SchemaFieldDraft): boolean {
  return field.type === "longText" || field.type === "json" || field.type === "relation" || field.type === "media";
}

export function relationKindLabel(field: SchemaFieldDraft): string {
  if (field.relationType === "oneToOne") return "One to one";
  if (field.relationType === "oneToMany") return "One to many";
  if (field.relationType === "manyToMany") return "Many to many";
  return "Many to one";
}

export function entryPrimaryLabel(entry: EntryRecord, fields: SchemaFieldDraft[]): string {
  const textField = fields.find((field) => typeof entry.data[field.slug] === "string" && field.type !== "relation");
  const value = textField ? entry.data[textField.slug] : undefined;
  return typeof value === "string" && value ? value : `Entry ${entry.id.slice(0, 8)}`;
}

export function entrySummaryValue(
  field: SchemaFieldDraft,
  value: unknown,
  relationEntries: EntryRecord[],
): string {
  if (isSingleRelationField(field)) {
    return typeof value === "string" && value ? relationLabelForId(value, relationEntries) : "None";
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

export function relationLabelForId(id: string, relationEntries: EntryRecord[]): string {
  const entry = relationEntries.find((item) => item.id === id);
  return entry ? entryLabel(entry) : id.slice(0, 8);
}

export function entryLabel(entry: EntryRecord): string {
  const preferredKeys = ["title", "name", "label", "slug"];
  for (const key of preferredKeys) {
    const value = entry.data[key];
    if (isLabelValue(value)) return `${String(value)} (${entry.id.slice(0, 8)})`;
  }
  const firstValue = Object.values(entry.data).find(isLabelValue);
  return firstValue ? `${String(firstValue)} (${entry.id.slice(0, 8)})` : entry.id.slice(0, 8);
}

export function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export function formatEntryDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function readEntryData(
  form: FormData,
  fields: SchemaFieldDraft[],
  setStatus: (status: string) => void,
): EntryData | null {
  const data: EntryData = {};
  try {
    for (const field of fields) {
      if (isMultiRelationField(field)) {
        const values = form.getAll(field.slug).map(String).filter(Boolean);
        if (field.required && values.length === 0) return requiredField(field.slug, setStatus);
        if (values.length > 0 || field.required) data[field.slug] = values;
        continue;
      }
      const raw = form.get(field.slug);
      if (field.type === "boolean") {
        data[field.slug] = raw === "on";
      } else if (field.required && (raw === null || raw === "")) {
        return requiredField(field.slug, setStatus);
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

function requiredField(slug: string, setStatus: (status: string) => void): null {
  setStatus(`ENTRY_FIELD_REQUIRED:${slug}`);
  return null;
}

function parseFieldValue(field: SchemaFieldDraft, raw: string): unknown {
  if (field.type === "number") return Number(raw);
  if (field.type === "json") return JSON.parse(raw);
  return raw;
}

function isLabelValue(value: unknown): value is string | number {
  return (typeof value === "string" && value.trim() !== "") || typeof value === "number";
}

function formatEntryValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Empty";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  return "Object";
}
