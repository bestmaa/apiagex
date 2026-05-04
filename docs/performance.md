# Performance

## English

Apiagex keeps the first performance pass simple and measurable.

Current hot-path indexes:

- `content_entries(content_type_id, status, publish_at)`
- `content_entries(content_type_id, status, updated_at)`
- `content_entry_versions(content_type_id, entry_id, created_at)`
- `content_fields(content_type_id, sort_order)`
- `content_types(display_name)`
- `media_files(created_at)`
- `audit_logs(created_at)`
- `schema_migrations(applied_at)`
- `webhook_deliveries(status, next_retry_at)`
- `webhook_deliveries(webhook_id, created_at)`
- `webhooks(enabled, created_at)`

Current cache layer:

- content-type and field schema data stay in memory until mutations invalidate them.
- public read responses use a short TTL cache and clear on content, media, and restore writes.
- media uploads currently use a local-disk adapter, with `s3` and `minio` reserved as future driver placeholders.

Useful commands:

```bash
npm run check
npm run smoke
npm run release:check
```

Use the release smoke test as the first baseline, then compare any further optimization against it.

## Hindi

Apiagex ka pehla performance pass simple aur measurable rakha gaya hai.

Current hot-path indexes:

- `content_entries(content_type_id, status, publish_at)`
- `content_entries(content_type_id, status, updated_at)`
- `content_entry_versions(content_type_id, entry_id, created_at)`
- `content_fields(content_type_id, sort_order)`
- `content_types(display_name)`
- `media_files(created_at)`
- `audit_logs(created_at)`
- `schema_migrations(applied_at)`
- `webhook_deliveries(status, next_retry_at)`
- `webhook_deliveries(webhook_id, created_at)`
- `webhooks(enabled, created_at)`

Current cache layer:

- content-type aur field schema data memory me rehti hai jab tak mutations unhe invalidate na kar dein.
- public read responses short TTL cache use karti hain aur content, media, aur restore writes par clear hoti hain.
- media uploads abhi local-disk adapter use karti hain, aur `s3` aur `minio` future driver placeholders ke liye reserved hain.

Useful commands:

```bash
npm run check
npm run smoke
npm run release:check
```

Release smoke test ko first baseline samjho, phir kisi bhi next optimization ko uske against compare karo.
