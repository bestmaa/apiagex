# Multi-Tenant Operations Runbook

Use placeholders only. Keep real tokens, database URLs, tenant secret keys, and owner passwords in a secret store or local shell.

## Provision Tenant

1. Create the tenant from Platform Admin UI or Platform API.
2. Choose provider: `sqlite`, `postgres`, or `mysql`.
3. Store the tenant database URL encrypted with `APIAGEX_TENANT_SECRET_KEY`.
4. Run tenant migrations before marking the tenant active.
5. Open the tenant admin URL and create/bootstrap the first owner.

Placeholder:

```bash
APIAGEX_PLATFORM_ADMIN_TOKEN="$PLATFORM_ADMIN_TOKEN" \
curl -X POST "$APIAGEX_BASE_URL/api/platform/tenants" \
  -H "Authorization: Bearer $APIAGEX_PLATFORM_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"slug":"tenant-slug","displayName":"Tenant Name","databaseProvider":"sqlite","databaseUrl":"file:.apiagex/tenants/tenant-slug.sqlite","uploadsPath":".apiagex/tenants/tenant-slug/uploads"}'
```

## Suspend Tenant

Suspension should stop tenant resolution before content/admin routes are reached. Keep audit metadata short and secret-free.

```bash
curl -X PATCH "$APIAGEX_BASE_URL/api/platform/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $PLATFORM_ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"status":"suspended"}'
```

## Migrate Tenants

Use the runtime guidance command first:

```bash
apiagex tenant migrate --dry-run
apiagex tenant migrate --tenant tenant-slug
```

Run one tenant first, verify health, then run all tenants in a maintenance window.

## Backup Tenant

SQLite:

```bash
apiagex tenant backup --tenant tenant-slug --output ./backups/tenant-slug
```

PostgreSQL/MySQL: use managed snapshots or operator-run dump tooling described in `docs/multi-tenant-backup.md`.

## Restore Tenant

Restore into a new tenant slug by default. Only overwrite an existing tenant when the operator passes an explicit overwrite flag in the restore workflow.

```bash
apiagex tenant restore --input ./backups/tenant-slug --as tenant-slug-restored
```

After restore:

1. Verify manifest checksums.
2. Run migrations.
3. Verify `/api/admin/health/tenant`.
4. Activate the tenant.

## Rotate Secrets

Tenant DB credentials:

1. Rotate in the database provider.
2. Encrypt and save the new tenant DB URL in the platform registry.
3. Restart or clear the tenant connection cache.
4. Verify tenant health.

Tenant secret key:

1. Stop writes.
2. Decrypt every tenant DB URL with the old key.
3. Re-encrypt with the new key.
4. Deploy with the new `APIAGEX_TENANT_SECRET_KEY`.
5. Verify tenant resolution and health.

## Debug Tenant

```bash
curl "$TENANT_BASE_URL/api/health"
curl "$TENANT_BASE_URL/api/admin/health/tenant" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Check these first:

- Tenant status is `active`.
- Host/subdomain/path-prefix resolves to the expected tenant.
- Tenant database migrations are current.
- Uploads path exists and is writable.
- Automation/API tokens were created in the same tenant, not another tenant.

## Rollback

If provisioning fails, mark the tenant `failed`, record sanitized audit metadata, and leave partial databases/uploads untouched for manual inspection. Do not put raw database URLs, passwords, tokens, or tenant secret keys in audit logs.
