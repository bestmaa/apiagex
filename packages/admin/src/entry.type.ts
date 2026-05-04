import type { SchemaRecord } from "./schema.type";

export type EntryData = Record<string, unknown>;

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

export type EntryFormProps = {
  schema: SchemaRecord;
  onCreated: () => Promise<void>;
};
