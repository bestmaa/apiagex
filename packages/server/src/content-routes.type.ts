import type { EntryData } from "@apiagex/database";

export type ContentListParams = {
  schemaSlug: string;
};

export type ContentPopulateQuery = {
  populate?: string;
};

export type ContentEntryParams = ContentListParams & {
  entryId: string;
};

export type ContentBody = {
  data: EntryData;
};
