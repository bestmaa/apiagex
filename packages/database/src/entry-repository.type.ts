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

export type CreateEntryInput = {
  schemaId: string;
  data: EntryData;
};

export type UpdateEntryInput = {
  data: EntryData;
};

export type EntryListOptions = {
  fields?: string[];
  limit?: number;
  offset?: number;
  search?: string;
};

export type EntryListResult = {
  entries: EntryRecord[];
  limit: number;
  offset: number;
  total: number;
};

export type EntryRecord = {
  id: string;
  schemaId: string;
  data: EntryData;
  createdAt: string;
  updatedAt: string;
};
