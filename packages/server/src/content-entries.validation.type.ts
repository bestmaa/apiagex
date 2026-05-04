import type { ContentTypeFieldDefinition } from './content-entries.routes.type.js';

export interface EntryValidationError {
  message: string;
  statusCode: 400;
}

export interface EntryValidationResult {
  error: EntryValidationError | null;
  value: Record<string, unknown> | null;
}

export type { ContentTypeFieldDefinition };
