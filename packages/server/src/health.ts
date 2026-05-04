export function buildHealthResponse(input: {
  docsReady: boolean;
  requestId?: string;
  schedulerRunning: boolean;
  storageDriver: 'local' | 'minio' | 's3';
  uploadsPath: string;
}): HealthDetailResponse {
  const response: Omit<HealthDetailResponse, 'requestId'> = {
    checks: {
      database: 'ready',
      docs: input.docsReady ? 'ready' : 'degraded',
      scheduler: input.schedulerRunning ? 'running' : 'stopped',
      uploads: 'ready',
    },
    docs: '/docs',
    requestIdHeader: 'x-request-id',
    scheduler: {
      status: input.schedulerRunning ? 'running' : 'stopped',
    },
    service: 'apiagex',
    status: 'ok',
    storage: {
      driver: input.storageDriver,
      uploadsPath: input.uploadsPath,
    },
  };

  if (typeof input.requestId === 'string' && input.requestId) {
    return {
      ...response,
      requestId: input.requestId,
    };
  }

  return response;
}

export interface HealthDetailResponse {
  checks: {
    database: 'ready';
    docs: 'ready' | 'degraded';
    scheduler: 'running' | 'stopped';
    uploads: 'ready';
  };
  docs: string;
  requestId?: string;
  requestIdHeader: string;
  scheduler: {
    status: 'running' | 'stopped';
  };
  service: 'apiagex';
  status: 'ok';
  storage: {
    driver: 'local' | 'minio' | 's3';
    uploadsPath: string;
  };
}
