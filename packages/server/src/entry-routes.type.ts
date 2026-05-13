import type { EntryData } from "apiagex-database";

export type EntryListParams = {
  schemaId: string;
};

export type EntryListQuery = {
  fields?: string;
  limit?: string;
  offset?: string;
  search?: string;
};

export type EntryParams = EntryListParams & {
  entryId: string;
};

export type EntryBody = {
  data: EntryData;
};
