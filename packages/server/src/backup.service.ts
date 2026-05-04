import { basename, isAbsolute, join, relative } from 'node:path';

import type { BackupBundle, RestoreSummary } from './backup.bundle.type.js';
import type { BackupServiceOptions } from './backup.service.type.js';

export function exportBackupBundle(options: BackupServiceOptions): BackupBundle {
  const contentTypes = options.contentTypesRepository.list();
  const entries = contentTypes.flatMap((contentType) => options.contentEntriesRepository.list(contentType.id));
  const versions = contentTypes.flatMap((contentType) =>
    entries
      .filter((entry) => entry.contentTypeId === contentType.id)
      .flatMap((entry) => options.contentEntriesRepository.listVersions(contentType.id, entry.id)),
  );

  return {
    auditLogs: options.auditLogsRepository.list(),
    contentTypes,
    entries,
    entryVersions: versions,
    exportedAt: new Date().toISOString(),
    mediaFiles: options.mediaFilesRepository.list().map((file) => ({
      ...file,
      contentBase64: options.mediaStorage.readBase64(file.storagePath),
    })),
    schemaMigrations: options.schemaMigrationsRepository.list(),
    version: 1,
    webhooks: {
      deliveries: options.webhooksRepository.list().flatMap((webhook) => options.webhooksRepository.listDeliveries(webhook.id)),
      items: options.webhooksRepository.list(),
    },
  };
}

export function restoreBackupBundle(options: BackupServiceOptions, bundle: BackupBundle): RestoreSummary {
  options.mediaStorage.clear();
  options.auditLogsRepository.replaceAll(bundle.auditLogs);
  options.schemaMigrationsRepository.replaceAll(bundle.schemaMigrations);
  options.contentTypesRepository.replaceAll(bundle.contentTypes);
  options.contentEntriesRepository.replaceAll({
    entries: bundle.entries,
    versions: bundle.entryVersions,
  });
  const restoredMediaFiles = bundle.mediaFiles.map((file) => ({
    ...file,
    storagePath: resolveStoragePath(options.storageDir, file.storagePath),
  }));
  restoreMediaFiles(options.mediaStorage, restoredMediaFiles);
  options.mediaFilesRepository.replaceAll(restoredMediaFiles.map(({ contentBase64: _contentBase64, ...file }) => file));
  options.webhooksRepository.replaceAll({
    deliveries: bundle.webhooks.deliveries,
    webhooks: bundle.webhooks.items,
  });

  return {
    auditLogs: bundle.auditLogs.length,
    contentTypes: bundle.contentTypes.length,
    entries: bundle.entries.length,
    mediaFiles: bundle.mediaFiles.length,
    schemaMigrations: bundle.schemaMigrations.length,
    webhooks: bundle.webhooks.items.length,
  };
}

function restoreMediaFiles(
  storage: BackupServiceOptions['mediaStorage'],
  files: readonly (Record<string, unknown> & { contentBase64: string; storagePath: string })[],
): void {
  for (const file of files) {
    const storagePath = String(file.storagePath);
    const contentBase64 = String(file.contentBase64);
    storage.restore(storagePath, contentBase64);
  }
}

function resolveStoragePath(storageDir: string, sourcePath: string): string {
  const relativePath = relative(storageDir, sourcePath);

  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return join(storageDir, basename(sourcePath));
  }

  return join(storageDir, relativePath);
}
