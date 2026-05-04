import type { EntryData } from "@apiagex/database";

export type EntryListParams = {
  schemaId: string;
};

export type EntryParams = EntryListParams & {
  entryId: string;
};

export type EntryBody = {
  data: EntryData;
};
