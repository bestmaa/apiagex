# Multi-Tenant Backup Contract

Apiagex tenant backups use a versioned manifest plus provider-specific database artifacts and optional uploads.

## Backup Folder Shape

```text
tenant-backup/
  manifest.json
  database/
    tenant.sqlite | tenant.sql | provider-snapshot.txt
  uploads/
    ...
```

`manifest.json` uses `apiagex-tenant-backup/v1`.

Required fields:

- `tenant.id`, `tenant.slug`, `tenant.provider`, optional `tenant.domain`, optional `tenant.status`.
- `database.provider`, `database.artifactPath`, `database.sizeBytes`, `database.checksumSha256`.
- `uploads.basePath`, `uploads.files[]` with relative path, byte size, SHA-256 checksum, and optional content type.
- `includes.contentData`, `includes.uploads`, and `includes.secrets`.

`includes.secrets` must always be `false` for normal exports. Tenant database URLs, encrypted database URLs, owner passwords, API tokens, automation tokens, and app secrets are not exported.

## Restore Rules

Restore must create a new tenant or explicitly target the same tenant. It must not overwrite another tenant slug, domain, database path, or uploads folder unless an operator passes an explicit overwrite option in a future restore command.

The restore flow should verify every checksum before changing registry records. If any upload or database artifact fails checksum validation, restore must stop before activating the tenant.

## Provider Notes

SQLite backups can copy the tenant database file after checkpointing writes and include uploads in the same archive.

PostgreSQL and MySQL backups should use managed snapshots or vetted dump tooling outside Apiagex until secure in-process dump/restore tasks are implemented.

## PostgreSQL Strategy

Recommended options:

- Managed provider snapshot per tenant database when each tenant has its own database.
- Managed provider snapshot plus schema-level restore when each tenant has its own schema.
- Operator-run `pg_dump`/`pg_restore` from CI or an operations machine with least-privilege credentials.

Apiagex should store only the manifest and metadata for the backup. It should not print database URLs or passwords in logs. Restore should create a new tenant database/schema first, load the dump, verify application migrations, then activate or switch the tenant registry record.

Safe placeholder command:

```bash
pg_dump "$TENANT_DATABASE_URL" --format=custom --file tenant.dump
```

`TENANT_DATABASE_URL` must come from a secret store or local shell. Do not commit it to source files, docs, task files, or release notes.

## MySQL Strategy

Recommended options:

- Managed provider snapshot per tenant database.
- Operator-run `mysqldump`/restore from CI or an operations machine with least-privilege credentials.
- Read-only replica snapshot for large tenants when provider support exists.

Apiagex should store only the backup manifest and checksums. MySQL usernames, passwords, hostnames with credentials, and root/admin connection strings must not appear in manifests.

Safe placeholder command:

```bash
mysqldump --single-transaction --set-gtid-purged=OFF "$TENANT_DATABASE_NAME" > tenant.sql
```

Credentials must be provided through a secure MySQL defaults file or secret store, not command history.

## SQLite Service

`backupSqliteTenant()` writes the v1 manifest, copies the SQLite database artifact, copies uploads, and records SHA-256 checksums.

`restoreSqliteTenant()` reads the manifest, verifies checksums, rejects tenant slug mismatch when `expectedTenantSlug` is provided, and refuses to overwrite an existing database or uploads target unless `allowOverwrite` is explicitly true.

This service restores files only. Platform registry changes still belong in an operator-controlled provision/restore workflow so another tenant is not accidentally pointed at restored data.

## Tenant Template Export/Import

For fresh tenants that should receive the same schema/workflow/role setup without content data, use the Admin API project-template endpoints against the selected tenant host:

```bash
curl "$TENANT_A_BASE_URL/api/admin/project-template" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > restaurant-template.json

curl -X POST "$TENANT_B_BASE_URL/api/admin/project-template/import" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d @restaurant-template.json
```

Templates include schemas, fields, roles, permissions, app settings, workflows, custom API route permissions, realtime settings, and webhook definitions with secrets regenerated. They do not include entries, users, API tokens, automation tokens, media binaries, or tenant database credentials.
