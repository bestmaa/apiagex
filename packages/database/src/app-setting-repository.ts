import type { ApiagexDatabase } from "./database-adapter.type.js";
import type { ApiDocsSettingsRecord, SetApiDocsSettingsInput } from "./app-setting-repository.type.js";

type AppSettingRow = {
  id: string;
  valueJson: string;
  updatedAt: string;
};

const apiDocsSettingId = "api_docs";

export async function getApiDocsSettings(db: ApiagexDatabase): Promise<ApiDocsSettingsRecord> {
  const row = await getAppSetting(db, apiDocsSettingId);
  if (!row) return { enabled: false, updatedAt: null };
  return {
    enabled: parseEnabled(row.valueJson),
    updatedAt: row.updatedAt,
  };
}

export async function setApiDocsSettings(
  db: ApiagexDatabase,
  input: SetApiDocsSettingsInput,
): Promise<ApiDocsSettingsRecord> {
  const now = new Date().toISOString();
  const valueJson = JSON.stringify({ enabled: Boolean(input.enabled) });
  const existing = await getAppSetting(db, apiDocsSettingId);
  if (existing) {
    await db.prepare("UPDATE app_settings SET value_json = ?, updated_at = ? WHERE id = ?")
      .run(valueJson, now, apiDocsSettingId);
  } else {
    await db.prepare("INSERT INTO app_settings (id, value_json, updated_at) VALUES (?, ?, ?)")
      .run(apiDocsSettingId, valueJson, now);
  }
  return getApiDocsSettings(db);
}

async function getAppSetting(db: ApiagexDatabase, id: string): Promise<AppSettingRow | undefined> {
  return db
    .prepare("SELECT id, value_json as valueJson, updated_at as updatedAt FROM app_settings WHERE id = ?")
    .get<AppSettingRow>(id);
}

function parseEnabled(valueJson: string): boolean {
  try {
    const value = JSON.parse(valueJson) as { enabled?: unknown };
    return value.enabled === true;
  } catch {
    return false;
  }
}
