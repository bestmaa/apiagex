import type { AdminAuthService } from './auth.type.js';
import type { AuditLogRepository } from './audit.type.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { WebhookEventBus } from './webhooks.events.type.js';

export type ContentTypeKind = 'collection' | 'single';

export type ContentTypePermissionAction = 'create' | 'delete' | 'list' | 'read' | 'update';

export interface ContentTypePermissionsInput {
  create?: readonly string[];
  delete?: readonly string[];
  list?: readonly string[];
  read?: readonly string[];
  update?: readonly string[];
}

export interface ContentTypePermissions {
  create: readonly string[];
  delete: readonly string[];
  list: readonly string[];
  read: readonly string[];
  update: readonly string[];
}

export interface ContentTypeFieldSettings {
  targetContentTypeId?: string;
}

export interface ContentTypeRealtimeActionsInput {
  create?: boolean;
  delete?: boolean;
  update?: boolean;
}

export interface ContentTypeRealtimeActions {
  create: boolean;
  delete: boolean;
  update: boolean;
}

export interface ContentTypeFieldInput {
  key: string;
  label: string;
  required: boolean;
  settings?: ContentTypeFieldSettings;
  type: 'boolean' | 'date' | 'media' | 'number' | 'relation' | 'richtext' | 'text';
  repeatable: boolean;
  sortOrder: number;
}

export interface ContentFieldRecord extends ContentTypeFieldInput {
  contentTypeId: string;
  id: string;
}

export interface ContentTypeInput {
  displayName: string;
  fields: readonly ContentTypeFieldInput[];
  kind: ContentTypeKind;
  permissions?: ContentTypePermissionsInput;
  realtimeEnabled?: boolean;
  realtimeActions?: ContentTypeRealtimeActionsInput;
  slug: string;
}

export interface ContentTypeRecord extends ContentTypeInput {
  id: string;
  permissions: ContentTypePermissions;
  realtimeEnabled: boolean;
  realtimeActions: ContentTypeRealtimeActions;
}

export interface ContentTypesStore {
  create(input: ContentTypeInput): ContentTypeRecord;
  delete(id: string): boolean;
  list(): readonly ContentTypeRecord[];
  update(id: string, input: ContentTypeInput): ContentTypeRecord | null;
}

export interface RegisterContentTypesRoutesOptions {
  auth: AdminAuthService;
  audit: AuditLogRepository;
  events?: WebhookEventBus;
  repository: ContentTypesRepository;
}
