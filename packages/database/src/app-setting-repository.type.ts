export type ApiDocsSettingsRecord = {
  adminEnabled: boolean;
  contentEnabled: boolean;
  updatedAt: string | null;
};

export type SetApiDocsSettingsInput = {
  adminEnabled: boolean;
  contentEnabled: boolean;
};
