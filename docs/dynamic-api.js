const LABELS = {
  en: {
    adminEntries: 'Admin entry endpoints',
    anonymousAllowed: 'Anonymous access is allowed when read/list permissions include `viewer`.',
    contentType: 'Content type',
    create: 'Create',
    delete: 'Delete',
    empty: 'No content types are available yet.',
    fieldCount: 'Field count',
    kind: 'Kind',
    list: 'List',
    read: 'Read',
    permissions: 'Required roles / permissions',
    publicRead: 'Public read endpoints',
    realtime: 'Realtime settings',
    readEndpoint: 'Read endpoint',
    readPath: 'Path',
    single: 'Single',
    update: 'Update',
    webhook: 'Webhook settings',
    bypass: 'Owner and admin always bypass these role checks.',
    webhookActions: 'Webhook action filters',
    webhookExample: 'Webhook filter example',
    webhookNote: 'Webhook filters can target this content type with `contentTypeIds` and `create` / `update` / `delete` actions.',
  },
  hi: {
    adminEntries: 'Admin entry endpoints',
    anonymousAllowed: 'Anonymous access tab allowed hota hai jab read/list permissions me `viewer` ho.',
    contentType: 'Content type',
    create: 'Create',
    delete: 'Delete',
    empty: 'Abhi koi content type available nahi hai.',
    fieldCount: 'Field count',
    kind: 'Kind',
    list: 'List',
    read: 'Read',
    permissions: 'Required roles / permissions',
    publicRead: 'Public read endpoints',
    realtime: 'Realtime settings',
    readEndpoint: 'Read endpoint',
    readPath: 'Path',
    single: 'Single',
    update: 'Update',
    webhook: 'Webhook settings',
    bypass: 'Owner aur admin hamesha in role checks ko bypass karte hain.',
    webhookActions: 'Webhook action filters',
    webhookExample: 'Webhook filter example',
    webhookNote: 'Webhook filters is content type ko `contentTypeIds` aur `create` / `update` / `delete` actions ke saath target kar sakte hain.',
  },
};

export function buildDynamicApiMarkdownSections(contentTypes) {
  return {
    en: buildLocaleSection(contentTypes, 'en'),
    hi: buildLocaleSection(contentTypes, 'hi'),
  };
}

function buildLocaleSection(contentTypes, language) {
  const labels = LABELS[language] ?? LABELS.en;

  if (!contentTypes.length) {
    return `- ${labels.empty}`;
  }

  return contentTypes
    .map((contentType) => buildContentTypeSection(contentType, labels))
    .join('\n\n');
}

function buildContentTypeSection(contentType, labels) {
  const slug = escapeMarkdown(contentType.slug ?? contentType.id ?? '');
  const displayName = escapeMarkdown(contentType.displayName ?? slug);
  const fieldCount = Number.isFinite(contentType.fieldCount) ? contentType.fieldCount : Array.isArray(contentType.fields) ? contentType.fields.length : 0;
  const permissions = contentType.permissions ?? {};
  const realtimeEnabled = Boolean(contentType.realtimeEnabled);
  const realtimeActions = contentType.realtimeActions ?? {};
  const webhookExample = buildWebhookFilterExample(contentType.slug ?? contentType.id ?? '', labels);

  return [
    `### ${displayName} \`${slug}\``,
    `- English: this page is generated from the live content type catalog for this record.`,
    `- Hindi: ye page is record ke live content type catalog se generate hota hai.`,
    `- ${labels.contentType}: \`${slug}\``,
    `- ${labels.kind}: ${escapeMarkdown(contentType.kind ?? 'collection')}`,
    `- ${labels.fieldCount}: ${fieldCount}`,
    `- ${labels.publicRead}`,
    `  - ${labels.list}: \`GET /api/${slug}\``,
    `  - ${labels.readEndpoint}: \`GET /api/${slug}/:entryId\``,
    `  - ${labels.anonymousAllowed}`,
    `- ${labels.adminEntries}`,
    `  - ${labels.list}: \`GET /admin/content-types/${slug}/entries\``,
    `  - ${labels.readEndpoint}: \`GET /admin/content-types/${slug}/entries/:entryId\``,
    `  - ${labels.create}: \`POST /admin/content-types/${slug}/entries\``,
    `  - ${labels.update}: \`PUT /admin/content-types/${slug}/entries/:entryId\``,
    `  - ${labels.delete}: \`DELETE /admin/content-types/${slug}/entries/:entryId\``,
    `- ${labels.permissions}`,
    `  - ${labels.create}: ${formatRoleList(permissions.create)}`,
    `  - ${labels.read}: ${formatRoleList(permissions.read)}`,
    `  - ${labels.list}: ${formatRoleList(permissions.list)}`,
    `  - ${labels.update}: ${formatRoleList(permissions.update)}`,
    `  - ${labels.delete}: ${formatRoleList(permissions.delete)}`,
    `  - ${labels.bypass}`,
    `- ${labels.realtime}`,
    `  - master: ${realtimeEnabled ? 'enabled' : 'disabled'}`,
    `  - actions: ${formatEnabledActions(realtimeActions)}`,
    `- ${labels.webhook}`,
    `  - ${labels.webhookNote}`,
    `  - ${labels.webhookActions}: ${formatEnabledActions(realtimeActions)}`,
    `  - ${labels.webhookExample}:`,
    `    \`\`\`json`,
    `    ${webhookExample}`,
    `    \`\`\``,
  ].join('\n');
}

function formatRoleList(value) {
  return Array.isArray(value) && value.length ? value.join(', ') : 'none';
}

function formatEnabledActions(realtimeActions) {
  const enabled = ['create', 'update', 'delete'].filter((action) => Boolean(realtimeActions?.[action]));

  return enabled.length ? enabled.join(', ') : 'none';
}

function escapeMarkdown(value) {
  return String(value)
    .replaceAll('`', '\\`')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_');
}

function buildWebhookFilterExample(slug, labels) {
  return JSON.stringify(
    {
      filters: {
        actions: ['create'],
        contentTypeIds: [slug],
      },
    },
    null,
    2,
  )
    .split('\n')
    .join('\n    ');
}
