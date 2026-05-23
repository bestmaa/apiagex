# Multi Tenant Architecture

Apiagex multi-tenant mode is for SaaS products where one platform serves many customers, but every customer needs isolated schemas, APIs, entries, admins, uploads, tokens, workflows, webhooks, and realtime settings.

Hinglish: Ek product hoga, bahut restaurants/customers honge. Har restaurant ka apna database, apna admin, apna schema/API builder, apna uploads, aur apna automation token hoga.

## Goals

- Keep single-tenant Apiagex simple and unchanged by default.
- Add an explicit multi-tenant runtime mode.
- Resolve each request to exactly one tenant.
- Use a separate Apiagex database per tenant.
- Use a separate uploads folder per tenant.
- Store tenant database credentials encrypted in a platform/control database.
- Support SQLite per tenant for local/dev.
- Support PostgreSQL and MySQL per tenant for production.
- Allow platform admins to provision, suspend, migrate, backup, restore, and inspect tenants.
- Keep tenant admins inside their own tenant only.

## Non Goals

- No shared `tenant_id` columns in the normal Apiagex content tables for the first implementation.
- No plaintext tenant DB URLs or passwords in API responses, logs, docs output, OpenAPI, AI/MCP output, or generated files.
- No automatic cross-tenant data sharing.
- No forced multi-tenant setup for normal single-project users.

## Core Shape

```text
Platform/control database
  tenants
  tenant_audit_events
  encrypted tenant connection settings

Tenant database: pizza-house
  schemas
  fields
  entries
  roles
  users
  permissions
  api_tokens
  automation_tokens
  workflows
  webhooks
  realtime settings

Tenant database: burger-point
  same Apiagex tables, different data
```

The platform database does not store tenant content. It stores the tenant registry and enough encrypted configuration to connect to each tenant database.

## Request Resolution

Apiagex should resolve tenants in this order:

1. Custom domain, such as `admin.pizzahouse.com`.
2. Subdomain, such as `pizza-house.yourapp.com`.
3. Optional local/dev path prefix, such as `/t/pizza-house`.

Detailed resolution rules are documented in `docs/multi-tenant-resolution.md`.

Environment variables for multi-tenant mode are documented in `docs/multi-tenant-environment.md`.

When a request arrives:

```text
Host: pizza-house.yourapp.com
GET /api/content/menu

1. Resolve tenant slug = pizza-house.
2. Load tenant registry record from platform DB.
3. Reject if tenant is suspended/archived/failed.
4. Decrypt tenant DB URL.
5. Get cached tenant DB connection.
6. Resolve tenant uploads path.
7. Run the normal Apiagex route against only that tenant context.
```

## URL Model

Recommended production URLs:

```text
https://pizza-house.yourapp.com/adminui
https://pizza-house.yourapp.com/api/admin/schemas
https://pizza-house.yourapp.com/api/content/menu

https://burger-point.yourapp.com/adminui
https://burger-point.yourapp.com/api/admin/schemas
https://burger-point.yourapp.com/api/content/menu
```

Optional local/dev URLs:

```text
http://127.0.0.1:4000/t/pizza-house/adminui
http://127.0.0.1:4000/t/pizza-house/api/content/menu
```

Path-prefix tenancy is useful for local testing, but subdomain/custom-domain tenancy is cleaner for production.

## Platform Database

The platform database stores tenant registry data only:

- Tenant id.
- Slug.
- Display name.
- Status.
- Primary domain.
- Subdomain.
- Database provider.
- Encrypted runtime database URL.
- Uploads path or uploads key prefix.
- Plan/billing metadata.
- Created and updated timestamps.
- Last provisioning/migration status.

The detailed registry contract is documented in `docs/multi-tenant-registry-schema.md`.

Runtime code opens the platform/control database separately from tenant databases. The first adapter helper is `openPlatformDatabase` from `@apiagex/database`; platform migrations are applied by a separate migration task.

The platform database should not store:

- Tenant entries/content.
- Tenant users.
- Tenant API tokens.
- Tenant automation tokens.
- Tenant webhook secrets.
- Plaintext tenant database passwords.

## Tenant Database

Each tenant database is a normal Apiagex database. It contains the same tables a single-tenant project uses today:

- `schemas`
- `fields`
- `entries`
- `roles`
- `users`
- `permissions`
- `api_tokens`
- `automation_tokens`
- `webhooks`
- `workflows`
- `realtime_configs`
- Other existing Apiagex tables.

This keeps the tenant runtime close to current Apiagex behavior and makes backup/restore easier.

## Database Provider Options

### SQLite Per Tenant

Best for local development, demos, small internal deployments, and tests.

Shape:

```text
tenants/
  pizza-house/
    data/apiagex.sqlite
    uploads/
  burger-point/
    data/apiagex.sqlite
    uploads/
```

Pros:

- Simple provisioning.
- No DB username/password per tenant.
- Easy local backup by copying tenant folder.
- Great for smoke tests.

Cons:

- Not ideal for high-traffic SaaS.
- File locking and operational backups need care.
- Horizontal scaling is harder.

### PostgreSQL Database Per Tenant

Recommended production path for many SaaS deployments.

Shape:

```text
postgres server/cluster
  database: pizza_house
  user: pizza_house_user

  database: burger_point
  user: burger_point_user
```

Provisioning admin credential:

- Stored only in runtime environment.
- Used only by the platform provisioning engine.
- Can create databases/users and grant privileges.

Tenant runtime credential:

- Stored encrypted in platform DB.
- Limited to exactly one tenant database.
- Used by normal tenant requests.

Pros:

- Strong tenant isolation.
- Good production tooling.
- Better concurrent traffic handling.
- Clear backup/restore boundaries.

Cons:

- Provisioning is more complex.
- Requires password rotation and privilege management.

### MySQL Database Per Tenant

Also valid for production when MySQL is the preferred provider.

Shape:

```text
mysql server/cluster
  database: pizza_house
  user: pizza_house_user

  database: burger_point
  user: burger_point_user
```

The same principle applies: provisioning admin credentials live only in environment variables; tenant runtime credentials are encrypted in the platform DB.

## DB User And Password Strategy

MVP/local:

- SQLite per tenant needs no DB username/password.
- PostgreSQL/MySQL can temporarily use one service runtime credential if needed.

Production:

- Use one database per tenant.
- Use one DB user/password per tenant.
- Grant that DB user access only to its own tenant database.
- Store the runtime tenant DB URL encrypted in the platform DB.
- Keep the provisioning/admin DB credential only in environment variables.

This gives a safer failure boundary. If one tenant runtime credential leaks, it cannot read other tenant databases.

## Provisioning Flow

When a platform admin creates a new tenant:

```text
1. Validate tenant slug/domain.
2. Create tenant registry row with status = provisioning.
3. Create tenant database.
4. Create tenant DB user/password when provider supports it.
5. Grant tenant user access only to that tenant database.
6. Encrypt tenant runtime DB URL and save it.
7. Create tenant uploads folder/prefix.
8. Run Apiagex tenant migrations.
9. Bootstrap first tenant owner or setup link.
10. Mark tenant status = active.
11. Record sanitized audit event.
```

If provisioning fails:

```text
1. Mark tenant status = failed.
2. Store sanitized failure code.
3. Keep enough metadata for retry.
4. Do not delete unrelated resources.
5. Allow explicit retry or cleanup from platform admin.
```

## Runtime Isolation Rules

- Tenant admin sessions are tenant-local.
- Tenant content API tokens are tenant-local.
- Tenant automation tokens are tenant-local.
- Tenant schemas and entries are tenant-local.
- Tenant workflows execute against tenant-local DB only.
- Tenant webhooks fire only for tenant-local changes.
- Tenant realtime sessions receive only tenant-local events.
- Tenant uploads serve only tenant-local files.

Cross-tenant isolation must be tested before release.

Tenant status behavior is defined in `docs/multi-tenant-lifecycle.md`.

## Uploads

Uploads should be scoped by tenant and then schema/field:

```text
uploads/
  tenants/
    pizza-house/
      article/
        hero/
          uuid-hero.png
    burger-point/
      menu-item/
        image/
          uuid-burger.webp
```

Tenant A must never be able to read Tenant B uploads through a guessed URL.

## AI And MCP

AI/MCP should connect to a tenant-specific base URL and use a tenant-specific automation token:

```text
APIAGEX_BASE_URL=https://pizza-house.yourapp.com
APIAGEX_AUTOMATION_TOKEN=agx_auto_...
```

This means Codex or another AI agent can create schemas/workflows for one restaurant without touching another restaurant.

Platform-level AI automation should be a separate explicit feature with stronger permissions.

## Admin Separation

There are two admin levels:

1. Platform admin.
2. Tenant admin.

Platform admin can:

- Create tenants.
- Suspend tenants.
- Retry provisioning.
- Rotate tenant DB credentials.
- Run tenant migrations.
- View tenant health.

Tenant admin can:

- Manage schemas.
- Manage entries.
- Manage tenant users/roles/tokens.
- Manage tenant workflows/webhooks/realtime.

Tenant admin cannot:

- List other tenants.
- See platform DB settings.
- See tenant database credentials.
- Change another tenant.

Platform APIs use `/api/platform/*` and require a separate platform admin token boundary. Tenant admin APIs stay under `/api/admin/*` and keep their existing tenant owner/session behavior.

## Migration Strategy

There are two migration streams:

1. Platform migrations for tenant registry tables.
2. Tenant migrations for normal Apiagex tables.

Upgrade flow:

```text
1. Backup platform DB.
2. Run platform migrations.
3. List tenants needing tenant DB migrations.
4. Migrate tenants one by one or in controlled batches.
5. Mark failed tenants as migration_required or failed.
6. Keep tenant runtime blocked or degraded if migration is required.
```

## Backup And Restore

SQLite tenants:

- Backup tenant SQLite file plus uploads folder.
- Restore into same slug or a new slug with explicit confirmation.

PostgreSQL tenants:

- Use database-level dumps/snapshots per tenant database.
- Uploads need separate object/file storage backup.

MySQL tenants:

- Use database-level dumps/snapshots per tenant database.
- Uploads need separate object/file storage backup.

Tenant backup exports should not include plaintext DB passwords, API tokens, automation tokens, or webhook secrets by default.

## Scaling Path

Phase 1:

- SQLite per tenant.
- Local/dev path-prefix or subdomain resolution.
- Platform DB in SQLite.

Phase 2:

- PostgreSQL/MySQL per tenant database.
- Per-tenant uploads folder.
- Platform admin APIs/UI.

Phase 3:

- Per-tenant DB user/password provisioning.
- Secret rotation.
- Tenant migration runner.
- Backup/restore tooling.

Phase 4:

- Custom domains.
- Object storage uploads.
- Tenant rate limits.
- Metrics and alerts.
- Optional container-per-tenant deployment for premium isolation.

## Release Gates

Multi-tenant mode should not be marked production-ready until these pass:

- Two-tenant smoke test.
- Cross-tenant admin API isolation tests.
- Cross-tenant content API isolation tests.
- Cross-tenant upload isolation tests.
- Cross-tenant AI/MCP token tests.
- Tenant provisioning failure/retry tests.
- Secret redaction tests.
- Platform DB migration tests.
- Tenant DB migration tests.
- Backup/restore documentation.

## Summary

The safest Apiagex SaaS model is:

```text
One platform database
Many tenant databases
One tenant runtime context per request
Encrypted tenant credentials
Tenant-scoped uploads
Tenant-local admin/users/tokens/schemas/entries/workflows
```

Hinglish summary: Platform DB sirf tenant list aur encrypted connection rakhega. Har restaurant ka apna Apiagex DB aur uploads folder hoga. Request jis tenant ki hogi, Apiagex sirf usi tenant ka DB/uploads use karega.
## Tenant Rate Limits And Metrics

Runtime code can pass `tenantRateLimit` and `tenantMetrics` to `createServer()`/`startApiagexServer()` integrations that wrap Apiagex.

Rate-limit hook input contains only safe tenant labels:

- `tenantId`
- `tenantSlug`
- `tenantStatus`
- `method`
- `path`

Returning `{ allowed: false }` blocks the request with `TENANT_RATE_LIMITED` and HTTP 429. The hook is optional, so local dev is not rate-limited unless the app explicitly installs a checker.

Metrics hooks receive the same tenant-safe labels on response and error events. Do not add raw domains, database names, database URLs, tokens, or user emails as metric labels because they can be high-cardinality or secret-bearing. Prefer tenant id/slug plus route template/method/status buckets.
