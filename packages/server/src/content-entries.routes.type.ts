import type { AdminAuthService } from './auth.type.js';
import type { AuditLogRepository } from './audit.type.js';
import type { ContentTypeKind, ContentTypeRecord } from './content-types.routes.type.js';
import type { RolesRepository } from './roles.repository.type.js';
import type { WebhookEventBus } from './webhooks.events.type.js';

export type ContentEntryStatus = 'draft' | 'pendingApproval' | 'published' | 'scheduled';

export interface ContentEntryInput {
  data: Record<string, unknown>;
  publishAt?: string | null;
  status?: ContentEntryStatus;
}

export interface ContentEntryRecord extends ContentEntryInput {
  contentTypeId: string;
  id: string;
  publishAt: string | null;
  status: ContentEntryStatus;
}

export interface ContentEntryVersionRecord extends ContentEntryInput {
  contentTypeId: string;
  createdAt: string;
  entryId: string;
  id: string;
  publishAt: string | null;
  status: ContentEntryStatus;
}

export interface ContentEntriesRouteOptions {
  auth: AdminAuthService;
  audit: AuditLogRepository;
  repository: ContentEntriesRepository;
  contentTypesRepository: ContentTypesLookup;
  mediaFilesRepository?: MediaFilesLookup;
  events?: WebhookEventBus;
  rolesRepository: RolesRepository;
}

export interface ContentEntriesRepository {
  clear(): void;
  close(): void;
  create(contentTypeId: string, input: ContentEntryInput): ContentEntryRecord | null;
  delete(contentTypeId: string, entryId: string): boolean;
  get(contentTypeId: string, entryId: string): ContentEntryRecord | null;
  list(contentTypeId: string): readonly ContentEntryRecord[];
  publishScheduled(beforeIso: string): readonly ContentEntryRecord[];
  listVersions(contentTypeId: string, entryId: string): readonly ContentEntryVersionRecord[];
  replaceAll(input: { entries: readonly ContentEntryRecord[]; versions: readonly ContentEntryVersionRecord[] }): void;
  restoreVersion(contentTypeId: string, entryId: string, versionId: string): ContentEntryRecord | null;
  update(
    contentTypeId: string,
    entryId: string,
    input: ContentEntryInput,
  ): ContentEntryRecord | null;
}

export interface ContentTypesLookup {
  get(
    id: string,
  ): Pick<ContentTypeRecord, 'id' | 'kind' | 'permissions' | 'realtimeActions' | 'realtimeEnabled' | 'slug'> | null;
  listFields(contentTypeId: string): readonly ContentTypeFieldDefinition[];
}

export interface MediaFilesLookup {
  get(id: string): { id: string } | null;
}

export interface ContentTypeFieldDefinition {
  key: string;
  label: string;
  repeatable: boolean;
  required: boolean;
  settings?: {
    targetContentTypeId?: string;
  };
  type: 'boolean' | 'date' | 'media' | 'number' | 'relation' | 'richtext' | 'text';
}
