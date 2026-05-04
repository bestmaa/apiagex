export type EntryData = Record<string, unknown>;

export type CreateEntryInput = {
  schemaId: string;
  data: EntryData;
};

export type UpdateEntryInput = {
  data: EntryData;
};

export type EntryRecord = {
  id: string;
  schemaId: string;
  data: EntryData;
  createdAt: string;
  updatedAt: string;
};
