import type { ContentTypesRepository } from './content-types.repository.type.js';
import type {
  RealtimeAction,
  RealtimeActionState,
  RealtimeMessage,
  RealtimeStreamManager,
} from './realtime.service.type.js';
import type { WebhookEvent } from './webhooks.events.type.js';

interface RealtimeConnection {
  send(chunk: string): void;
  types: Set<string>;
}

const GLOBAL_TARGET = '__global__';

export function createRealtimeStreamManager(): RealtimeStreamManager {
  const connections = new Set<RealtimeConnection>();

  return {
    close() {
      connections.clear();
    },
    connect(types: readonly string[], send: (chunk: string) => void) {
      const connection: RealtimeConnection = {
        send,
        types: new Set(types.map(normalizeType).filter(Boolean)),
      };

      connections.add(connection);
      send(formatSse('ready', { status: 'ok', types: [...connection.types] }));

      return () => {
        connections.delete(connection);
      };
    },
    publish(event: WebhookEvent, contentTypes: Pick<ContentTypesRepository, 'get'>) {
      const targets = resolveTargets(event, contentTypes);

      if (!targets.length) {
        return;
      }

      const chunk = formatSse('update', buildMessage(event, targets));

      for (const connection of connections) {
        if (!shouldNotify(connection.types, targets)) {
          continue;
        }

        try {
          connection.send(chunk);
        } catch {
          connections.delete(connection);
        }
      }
    },
  };
}

function buildMessage(event: WebhookEvent, targets: readonly string[]): RealtimeMessage {
  return {
    action: event.action,
    contentTypeId: getContentTypeId(event),
    contentTypeSlug: targets[0] ?? '',
    createdAt: event.createdAt,
    details: event.details,
    name: event.name,
    scope: event.scope,
    subjectId: event.subjectId,
    targets,
  };
}

function getContentTypeId(event: WebhookEvent): string {
  const contentTypeId = event.details['contentTypeId'];

  if (typeof contentTypeId === 'string') {
    return contentTypeId;
  }

  return event.scope === 'content-types' ? event.subjectId : '';
}

function formatSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function normalizeType(value: string): string {
  return value.trim();
}

function resolveTargets(
  event: WebhookEvent,
  contentTypes: Pick<ContentTypesRepository, 'get'>,
): string[] {
  const action = toRealtimeAction(event.action);

  if (!action) {
    return [];
  }

  if (event.scope === 'content-types') {
    const contentType = contentTypes.get(event.subjectId);

    if (contentType && canPublish(contentType.realtimeEnabled, contentType.realtimeActions, action)) {
      return [contentType.slug];
    }

    const snapshot = readContentTypeSnapshot(event.details);

    if (snapshot && canPublish(snapshot.realtimeEnabled, snapshot.realtimeActions, action)) {
      return [snapshot.slug];
    }
  }

  if (event.scope === 'content-fields' || event.scope === 'content-entries') {
    const contentTypeId = typeof event.details['contentTypeId'] === 'string' ? event.details['contentTypeId'] : '';
    const contentType = contentTypeId ? contentTypes.get(contentTypeId) : null;

    if (contentType && canPublish(contentType.realtimeEnabled, contentType.realtimeActions, action)) {
      return [contentType.slug];
    }
  }

  if (event.scope === 'media-files') {
    return [GLOBAL_TARGET];
  }

  return [];
}

function canPublish(
  realtimeEnabled: boolean,
  realtimeActions: Partial<RealtimeActionState> | undefined,
  action: RealtimeAction,
): boolean {
  if (!realtimeEnabled) {
    return false;
  }

  const actionEnabled = realtimeActions?.[action];

  return typeof actionEnabled === 'boolean' ? actionEnabled : true;
}

function readContentTypeSnapshot(details: Record<string, unknown>): {
  realtimeActions: RealtimeActionState;
  realtimeEnabled: boolean;
  slug: string;
} | null {
  const slug = typeof details.slug === 'string' ? details.slug.trim() : '';
  if (!slug) {
    return null;
  }

  const realtimeEnabled = typeof details.realtimeEnabled === 'boolean' ? details.realtimeEnabled : false;
  const realtimeActions = normalizeRealtimeActionState(details.realtimeActions, realtimeEnabled);

  return {
    realtimeActions,
    realtimeEnabled,
    slug,
  };
}

function normalizeRealtimeActionState(
  value: unknown,
  fallback: boolean,
): RealtimeActionState {
  const actions = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

  return {
    create: normalizeRealtimeAction(actions.create, fallback),
    delete: normalizeRealtimeAction(actions.delete, fallback),
    update: normalizeRealtimeAction(actions.update, fallback),
  };
}

function normalizeRealtimeAction(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toRealtimeAction(value: string): RealtimeAction | null {
  if (value === 'create' || value === 'delete' || value === 'update') {
    return value;
  }

  return null;
}

function shouldNotify(subscribedTypes: Set<string>, targets: readonly string[]): boolean {
  if (targets.includes(GLOBAL_TARGET)) {
    return true;
  }

  if (!subscribedTypes.size) {
    return true;
  }

  return targets.some((target) => subscribedTypes.has(target));
}
