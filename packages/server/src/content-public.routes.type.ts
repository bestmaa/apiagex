import type { AdminAuthService } from './auth.type.js';
import type { ContentEntriesRepository } from './content-entries.routes.type.js';
import type { ContentTypesLookup } from './content-entries.routes.type.js';
import type { MediaFilesRepository } from './media.repository.type.js';
import type { PublicResponseCache } from './content-public.cache.type.js';
import type { RolesRepository } from './roles.repository.type.js';

export interface PublicEntryRecord {
  data: Record<string, unknown>;
  id: string;
}

export interface PublicMediaRecord {
  filename: string;
  id: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface ContentPublicRouteOptions {
  contentEntriesRepository: Pick<ContentEntriesRepository, 'get' | 'list'>;
  contentTypesRepository: ContentTypesLookup;
  mediaFilesRepository?: Pick<MediaFilesRepository, 'get'>;
  previewAuth?: Pick<AdminAuthService, 'verifyPreviewToken' | 'verifyToken'>;
  responseCache?: PublicResponseCache;
  rolesRepository: Pick<RolesRepository, 'get' | 'getByName'>;
}
