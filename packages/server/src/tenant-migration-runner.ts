import {
  getProviderFoundationMigration,
  migrateProviderFoundation,
  MVP_MIGRATION_ID,
  type ApiagexDatabase,
  type DatabaseProvider,
  type MvpTableName,
} from "@apiagex/database";

export type TenantMigrationRunResult = {
  migrationId: string;
  provider: DatabaseProvider;
  tables: readonly MvpTableName[];
};

export async function runTenantMigrations(
  db: ApiagexDatabase,
  provider: DatabaseProvider = db.provider,
): Promise<TenantMigrationRunResult> {
  if (provider !== db.provider) throw new Error("TENANT_MIGRATION_PROVIDER_MISMATCH");
  const migration = getProviderFoundationMigration(provider);
  await migrateProviderFoundation(db, provider);
  return {
    migrationId: MVP_MIGRATION_ID,
    provider,
    tables: migration.tables,
  };
}
