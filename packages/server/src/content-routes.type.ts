import type { EntryData } from "apiagex-database";

export type ContentListParams = {
  schemaSlug: string;
};

export type ContentPopulateQuery = {
  fields?: string;
  limit?: string;
  offset?: string;
  populate?: string;
  search?: string;
};

export type ContentEntryParams = ContentListParams & {
  entryId: string;
};

export type ContentBody = {
  data: EntryData;
};
