import type {
  ContentFieldRecord,
  ContentTypeFieldInput,
  ContentTypeInput,
  ContentTypeRecord,
  ContentTypesStore,
} from './content-types.routes.type.js';

export interface ContentTypesRepository extends ContentTypesStore {
  close(): void;
  clear(): void;
  createField(contentTypeId: string, input: ContentTypeFieldInput): ContentFieldRecord | null;
  deleteField(contentTypeId: string, fieldKey: string): boolean;
  get(id: string): ContentTypeRecord | null;
  getField(contentTypeId: string, fieldKey: string): ContentFieldRecord | null;
  listFields(contentTypeId: string): readonly ContentFieldRecord[];
  replaceAll(records: readonly ContentTypeRecord[]): void;
  updateField(
    contentTypeId: string,
    fieldKey: string,
    input: ContentTypeFieldInput,
  ): ContentFieldRecord | null;
}

export interface ContentTypesRepositoryFactory {
  create(databaseFile: string): ContentTypesRepository;
}

export interface ContentFieldRow {
  content_type_id: string;
  field_key: string;
  label: string;
  required: number;
  repeatable: number;
  sort_order: number;
  settings_json: string;
  type: string;
}

export interface ContentTypeRow {
  display_name: string;
  id: string;
  kind: string;
  permissions_json: string | null;
  realtime_create_enabled: number | null;
  realtime_delete_enabled: number | null;
  realtime_enabled: number;
  realtime_update_enabled: number | null;
  slug: string;
}

export type { ContentTypeInput, ContentTypeRecord };
