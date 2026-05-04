import { randomUUID } from 'node:crypto';

import type { MediaFileInput, MediaFileRecord, MediaFileRow } from './media.repository.type.js';

export function makeMediaFileRecord(input: MediaFileInput): MediaFileRecord {
  const now = new Date().toISOString();

  return {
    ...input,
    createdAt: now,
    id: randomUUID(),
    updatedAt: now,
  };
}

export function mapMediaFileRow(row: MediaFileRow): MediaFileRecord {
  return {
    createdAt: row.created_at,
    filename: row.filename,
    id: row.id,
    mimeType: row.mime_type,
    size: row.size,
    storagePath: row.storage_path,
    updatedAt: row.updated_at,
  };
}
