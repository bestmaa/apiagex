export interface PublicResponseCache {
  clear(): void;
  delete(key: string): void;
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}
