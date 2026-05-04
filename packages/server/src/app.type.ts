import type { FastifyInstance } from 'fastify';

export interface BuildServerOptions {
  adminEmail?: string;
  adminPassword?: string;
  adminUiRoot?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  contentTypesDatabaseFile?: string;
  docsRoot?: string;
  readmeFile?: string;
  authSecret?: string;
  editorEmail?: string;
  editorPassword?: string;
  mediaStorageDir?: string;
  publicResponseCacheTtlMs?: number;
  logger?: boolean;
  host?: string;
  viewerEmail?: string;
  viewerPassword?: string;
  port?: number;
}

export type ApiagexServer = FastifyInstance;
