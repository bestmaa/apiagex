export interface MediaStorageAdapter {
  clear(): void;
  readBase64(storagePath: string): string;
  restore(storagePath: string, contentBase64: string): void;
  save(filename: string, contentBase64: string): string;
}
