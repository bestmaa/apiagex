import type { AdminAuthService } from './auth.type.js';
import type { ContentEntriesRepository } from './content-entries.routes.type.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { RolesRepository } from './roles.repository.type.js';

export interface ContentPreviewRouteOptions {
  auth: AdminAuthService;
  contentEntriesRepository: Pick<ContentEntriesRepository, 'get'>;
  contentTypesRepository: ContentTypesRepository;
  rolesRepository: Pick<RolesRepository, 'get' | 'getByName'>;
}
