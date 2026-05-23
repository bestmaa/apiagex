# Multi-Tenant Release Checklist

Multi-tenant mode must stay preview/beta unless every gate below passes for the target release.

## Build And Tests

- `npm run build`
- `npm run smoke`
- Tenant isolation suite covers admin, content, media, automation tokens, AI plan apply, templates, realtime config, webhook config, rate-limit labels, and metrics labels.
- Platform tenant route tests pass.
- Secret redaction tests pass.

## Platform Registry

- Platform database provider and URL are configured through secrets/env.
- `APIAGEX_TENANT_SECRET_KEY` is present, stable, backed up, and not logged.
- Tenant records expose only safe tenant data in API responses.
- Suspended/failed tenants cannot access tenant routes.

## Tenant Provisioning

- SQLite tenant path and uploads path are inside the intended tenant root.
- PostgreSQL/MySQL tenant database and user names use safe generated identifiers.
- Tenant migrations run before activation.
- Provisioning failures mark tenants failed and record redacted audit metadata.

## Backup And Restore

- Backup manifest excludes secrets.
- SQLite backup/restore checksum verification passes.
- PostgreSQL/MySQL use managed snapshots or vetted operator dump tooling.
- Restore never overwrites another tenant without explicit operator approval.

## Runtime

- Tenant resolution works for selected host/subdomain/path-prefix strategy.
- Request-scoped database and uploads paths are active.
- Automation tokens and API tokens are tenant-local.
- Rate limit and metrics hooks use only tenant id/slug/status labels.

## Rollback

- Previous package version is known.
- Platform DB backup exists.
- Tenant DB backup/snapshot exists.
- Rollback notes mention any migration that cannot be reversed automatically.

## Publish Decision

Do not publish as production-ready if any isolation, secret redaction, backup, migration, or rollback check is incomplete. Mark release notes as preview/beta when operator workflows still require manual steps.
