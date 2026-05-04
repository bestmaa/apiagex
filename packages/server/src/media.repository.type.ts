export interface MediaFileInput {
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export interface MediaFileRecord extends MediaFileInput {
  createdAt: string;
  id: string;
  updatedAt: string;
}

export interface MediaFileRow {
  created_at: string;
  filename: string;
  id: string;
  mime_type: string;
  size: number;
  storage_path: string;
  updated_at: string;
}

export interface MediaFilesRepository {
  close(): void;
  create(input: MediaFileInput): MediaFileRecord;
  clear(): void;
  get(id: string): MediaFileRecord | null;
  list(): readonly MediaFileRecord[];
  replaceAll(records: readonly MediaFileRecord[]): void;
}
