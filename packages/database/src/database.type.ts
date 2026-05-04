export type DatabaseClient = 'sqlite' | 'postgres' | 'mysql';

export interface DatabaseConnectionConfig {
  client: DatabaseClient;
  file?: string;
  host?: string;
  name?: string;
  password?: string;
  port?: number;
  user?: string;
}

export interface DatabaseAdapterDescriptor {
  client: DatabaseClient;
  description: string;
  displayName: string;
}

export interface DatabaseAdapterSelection {
  config: DatabaseConnectionConfig;
  descriptor: DatabaseAdapterDescriptor;
}
