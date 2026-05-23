import type { ApiagexDatabase, TenantRecord } from "@apiagex/database";

export type TenantConnectionCacheOptions = {
  maxConnections?: number | undefined;
  now?: (() => number) | undefined;
  openTenantDatabase: (tenant: TenantRecord) => Promise<ApiagexDatabase>;
  ttlMs?: number | undefined;
};

type CachedTenantConnection = {
  database: ApiagexDatabase;
  expiresAt: number;
  lastUsedAt: number;
};

export class TenantConnectionCache {
  private readonly cache = new Map<string, CachedTenantConnection>();
  private readonly maxConnections: number;
  private readonly now: () => number;
  private readonly ttlMs: number;

  constructor(private readonly options: TenantConnectionCacheOptions) {
    this.maxConnections = options.maxConnections ?? 50;
    this.now = options.now ?? Date.now;
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000;
  }

  get size(): number {
    return this.cache.size;
  }

  async get(tenant: TenantRecord): Promise<ApiagexDatabase> {
    const current = this.cache.get(tenant.id);
    const now = this.now();
    if (current && current.expiresAt > now) {
      current.lastUsedAt = now;
      current.expiresAt = now + this.ttlMs;
      return current.database;
    }
    if (current) await this.invalidate(tenant.id);
    const database = await this.options.openTenantDatabase(tenant);
    this.cache.set(tenant.id, {
      database,
      expiresAt: now + this.ttlMs,
      lastUsedAt: now,
    });
    await this.evictOverflow();
    return database;
  }

  async invalidate(tenantId: string): Promise<void> {
    const current = this.cache.get(tenantId);
    if (!current) return;
    this.cache.delete(tenantId);
    await current.database.close();
  }

  async closeAll(): Promise<void> {
    const connections = [...this.cache.values()];
    this.cache.clear();
    await Promise.all(connections.map((connection) => connection.database.close()));
  }

  private async evictOverflow(): Promise<void> {
    while (this.cache.size > this.maxConnections) {
      const oldest = [...this.cache.entries()]
        .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt)[0];
      if (!oldest) return;
      await this.invalidate(oldest[0]);
    }
  }
}
