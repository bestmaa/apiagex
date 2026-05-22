export type ProjectTemplateRow = Record<string, string | number | null>;

export type ProjectTemplate = {
  exportedAt: string;
  kind: "apiagex.project-template";
  tables: {
    adminPermissions: ProjectTemplateRow[];
    appSettings: ProjectTemplateRow[];
    customApiPermissions: ProjectTemplateRow[];
    customApiRoutes: ProjectTemplateRow[];
    fields: ProjectTemplateRow[];
    permissions: ProjectTemplateRow[];
    realtimeConfigs: ProjectTemplateRow[];
    roles: ProjectTemplateRow[];
    schemas: ProjectTemplateRow[];
    webhooks: ProjectTemplateRow[];
    workflows: ProjectTemplateRow[];
  };
  version: 1;
};

export type ProjectTemplateImportResponse = {
  ok: boolean;
  imported?: Record<string, number>;
  skipped?: Record<string, number>;
  error?: string;
};
