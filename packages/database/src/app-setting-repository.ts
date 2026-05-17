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
  if (!row) return { adminEnabled: false, contentEnabled: false, updatedAt: null };
  return {
    ...parseSettings(row.valueJson),
    updatedAt: row.updatedAt,
  };
}

export async function setApiDocsSettings(
  db: ApiagexDatabase,
  input: SetApiDocsSettingsInput,
): Promise<ApiDocsSettingsRecord> {
  const now = new Date().toISOString();
  const valueJson = JSON.stringify({
    adminEnabled: Boolean(input.adminEnabled),
    contentEnabled: Boolean(input.contentEnabled),
  });
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
