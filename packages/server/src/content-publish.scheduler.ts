import { recordSystemAudit } from './audit.js';
import type { AuditLogRepository } from './audit.type.js';
import type { ContentEntryRecord } from './content-entries.routes.type.js';
import type { ContentPublishScheduler, ContentPublishSchedulerOptions } from './content-publish.scheduler.type.js';
import type { ContentTypesRepository } from './content-types.repository.type.js';
import type { WebhookEventBus } from './webhooks.events.type.js';

export interface ContentPublishSchedulerRuntimeOptions extends ContentPublishSchedulerOptions {
  audit?: AuditLogRepository;
  contentTypesRepository: Pick<ContentTypesRepository, 'get'>;
  events?: WebhookEventBus;
}

const DEFAULT_INTERVAL_MS = 30_000;

export function createContentPublishScheduler(
  options: ContentPublishSchedulerRuntimeOptions,
): ContentPublishScheduler {
  let timer: ReturnType<typeof setInterval> | null = null;
  let started = false;

  async function sweep(now = new Date()): Promise<readonly ContentEntryRecord[]> {
    const entries = options.repository.publishScheduled(now.toISOString());

    for (const entry of entries) {
      const contentType = options.contentTypesRepository.get(entry.contentTypeId);
      const details = {
        contentTypeId: entry.contentTypeId,
        contentTypeSlug: contentType?.slug ?? entry.contentTypeId,
        publishAt: entry.publishAt,
        status: entry.status,
      };

      if (options.audit) {
        recordSystemAudit(options.audit, 'content-entries', 'update', entry.id, details, options.events);
      } else {
        options.events?.publish({
          action: 'update',
          actorEmail: 'system@apiagex.local',
          actorRole: 'admin',
          createdAt: now.toISOString(),
          details,
          name: 'content-entries.update',
          scope: 'content-entries',
          subjectId: entry.id,
        });
      }
    }

    await options.onPublish?.(entries);
    return entries;
  }

  return {
    close() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    isRunning() {
      return started;
    },
    async start() {
      if (started) {
        return;
      }

      started = true;
      await sweep();
      timer = setInterval(() => {
        void sweep();
      }, options.intervalMs ?? DEFAULT_INTERVAL_MS);
    },
    sweep,
  };
}
