import { AsyncLocalStorage } from "node:async_hooks";
import type { FastifyInstance } from "fastify";
import type { ApiagexDatabase, DatabaseProvider, DatabaseStatement } from "@apiagex/database";
import type { ApiagexTenantContext } from "./tenant-context.js";

export type ApiagexRequestRuntime = {
  database: ApiagexDatabase;
  uploadsPath: string;
};

const requestRuntime = new AsyncLocalStorage<ApiagexRequestRuntime>();

export function registerRequestRuntime(
  server: FastifyInstance,
  fallback: ApiagexRequestRuntime,
): void {
  server.addHook("preHandler", async (request) => {
    const tenantContext = (request as { apiagexTenant?: ApiagexTenantContext | null }).apiagexTenant;
    requestRuntime.enterWith({
      database: tenantContext?.database ?? fallback.database,
      uploadsPath: tenantContext?.uploadsPath ?? fallback.uploadsPath,
    });
  });
}

export function currentRequestRuntime(fallback: ApiagexRequestRuntime): ApiagexRequestRuntime {
  return requestRuntime.getStore() ?? fallback;
}

export function createRequestScopedDatabase(fallback: ApiagexDatabase): ApiagexDatabase {
  return {
    get provider(): DatabaseProvider {
      return currentDatabase(fallback).provider;
    },
    close: () => fallback.close(),
    exec: (sql: string) => currentDatabase(fallback).exec(sql),
    prepare: (sql: string): DatabaseStatement => ({
      all: (...params) => currentDatabase(fallback).prepare(sql).all(...params),
      get: (...params) => currentDatabase(fallback).prepare(sql).get(...params),
      run: (...params) => currentDatabase(fallback).prepare(sql).run(...params),
    }),
    transaction: (callback) => currentDatabase(fallback).transaction(callback),
  };
}

export function currentUploadsPath(fallbackUploadsPath: string): string {
  return requestRuntime.getStore()?.uploadsPath ?? fallbackUploadsPath;
}

function currentDatabase(fallback: ApiagexDatabase): ApiagexDatabase {
  return requestRuntime.getStore()?.database ?? fallback;
}
