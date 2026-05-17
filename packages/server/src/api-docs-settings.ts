import type { ApiagexDatabase } from "@apiagex/database";

export type ApiDocsSettingsRecord = {
  adminEnabled: boolean;
  contentEnabled: boolean;
  updatedAt: string | null;
};

const apiDocsSettingId = "api_docs";

export async function getApiDocsSettings(database: ApiagexDatabase): Promise<ApiDocsSettingsRecord> {
  await ensureApiDocsSettingsTable(database);
  const row = await database
    .prepare("SELECT value_json as valueJson, updated_at as updatedAt FROM app_settings WHERE id = ?")
    .get<{ valueJson: string; updatedAt: string }>(apiDocsSettingId);
  if (!row) return { adminEnabled: false, contentEnabled: false, updatedAt: null };
  return { ...parseSettings(row.valueJson), updatedAt: row.updatedAt };
}

export async function setApiDocsSettings(
  database: ApiagexDatabase,
  input: { adminEnabled: boolean; contentEnabled: boolean },
): Promise<ApiDocsSettingsRecord> {
  await ensureApiDocsSettingsTable(database);
  const now = new Date().toISOString();
  const valueJson = JSON.stringify({
    adminEnabled: Boolean(input.adminEnabled),
    contentEnabled: Boolean(input.contentEnabled),
  });
  const existing = await database
    .prepare("SELECT id FROM app_settings WHERE id = ?")
    .get<{ id: string }>(apiDocsSettingId);
  if (existing) {
    await database.prepare("UPDATE app_settings SET value_json = ?, updated_at = ? WHERE id = ?")
      .run(valueJson, now, apiDocsSettingId);
  } else {
    await database.prepare("INSERT INTO app_settings (id, value_json, updated_at) VALUES (?, ?, ?)")
      .run(apiDocsSettingId, valueJson, now);
  }
  return getApiDocsSettings(database);
}

async function ensureApiDocsSettingsTable(database: ApiagexDatabase): Promise<void> {
  if (database.provider === "mysql") {
    await database.exec("CREATE TABLE IF NOT EXISTS app_settings (id VARCHAR(191) PRIMARY KEY, value_json LONGTEXT NOT NULL, updated_at TEXT NOT NULL) ENGINE=InnoDB");
    return;
  }
  await database.exec("CREATE TABLE IF NOT EXISTS app_settings (id TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL)");
}

function parseSettings(valueJson: string): Pick<ApiDocsSettingsRecord, "adminEnabled" | "contentEnabled"> {
  try {
    const value = JSON.parse(valueJson) as {
      adminEnabled?: unknown;
      contentEnabled?: unknown;
      enabled?: unknown;
    };
    const legacyEnabled = value.enabled === true;
    return {
      adminEnabled: value.adminEnabled === true || legacyEnabled,
      contentEnabled: value.contentEnabled === true || legacyEnabled,
    };
  } catch {
    return { adminEnabled: false, contentEnabled: false };
  }
}
