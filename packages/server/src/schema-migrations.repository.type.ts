export interface SchemaMigrationInput {
  appliedAt?: string;
  name: string;
  scope: string;
}

export interface SchemaMigrationRecord extends SchemaMigrationInput {
  appliedAt: string;
}

export interface SchemaMigrationsRepository {
  clear(): void;
  list(): readonly SchemaMigrationRecord[];
  record(input: SchemaMigrationInput): SchemaMigrationRecord;
  replaceAll(records: readonly SchemaMigrationRecord[]): void;
  close(): void;
}
