export type ProjectTemplate = {
  exportedAt: string;
  kind: "apiagex.project-template";
  tables: Record<string, Array<Record<string, string | number | null>>>;
  version: 1;
};

export type ProjectTemplateExportResponse = {
  ok: boolean;
  template?: ProjectTemplate;
  error?: string;
};

export type ProjectTemplateImportResponse = {
  ok: boolean;
  imported?: Record<string, number>;
  skipped?: Record<string, number>;
  error?: string;
};
