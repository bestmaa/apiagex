import type { ContentEntryRecord, ContentEntriesRepository } from './content-entries.routes.type.js';

export interface ContentPublishSchedulerOptions {
  intervalMs?: number;
  onPublish?: (entries: readonly ContentEntryRecord[]) => void | Promise<void>;
  repository: Pick<ContentEntriesRepository, 'publishScheduled'>;
}

export interface ContentPublishScheduler {
  close(): void;
  isRunning(): boolean;
  start(): Promise<void>;
  sweep(now?: Date): Promise<readonly ContentEntryRecord[]>;
}
