import type { AdminAuthService } from './auth.type.js';
import type { ContentEntriesRepository } from './content-entries.routes.type.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { MediaFilesRepository } from './media.repository.type.js';
import type { RolesRepository } from './roles.repository.type.js';

export interface SearchRoutesOptions {
  auth: AdminAuthService;
  contentEntriesRepository: ContentEntriesRepository;
  contentTypesRepository: ContentTypesRepository;
  mediaFilesRepository: MediaFilesRepository;
  rolesRepository: Pick<RolesRepository, 'get' | 'getByName'>;
}

export interface SearchResultItem {
  contentTypeId?: string;
  contentTypeSlug?: string;
  detail: string;
  entryId?: string;
  id: string;
  kind: 'content-type' | 'entry' | 'media';
  mediaUrl?: string;
  subtitle: string;
  title: string;
}
