import type { SchemaRecord } from "./schema.type";

export type SingleRelationEntryValue = string | null;

export type MultiRelationEntryValue = string[];

export type RelationEntryValue = SingleRelationEntryValue | MultiRelationEntryValue;

export type EntryFieldValue =
  | boolean
  | number
  | string
  | null
  | Record<string, unknown>
  | unknown[]
  | RelationEntryValue;

export type EntryData = Record<string, EntryFieldValue | undefined>;

export type EntryRecord = {
  id: string;
  schemaId: string;
  data: EntryData;
  createdAt: string;
  updatedAt: string;
};

export type EntryListResponse = {
  ok: boolean;
  entries?: EntryRecord[];
  error?: string;
};

export type EntryMutationResponse = {
  ok: boolean;
  entry?: EntryRecord;
  error?: string;
};

export type EntryDeleteResponse = {
  ok: boolean;
  deleted?: boolean;
  error?: string;
};

export type EntryFormProps = {
  schema: SchemaRecord;
  editingEntry: EntryRecord | null;
  onCreated: () => Promise<void>;
  onCancelEdit: () => void;
};
