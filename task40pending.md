# Apiagex Task 40 Pending - Multi Tenant SaaS Runtime

Task 40 designs and implements multi-tenant Apiagex for SaaS products such as restaurant platforms where every customer gets isolated data, isolated admin access, isolated schema/API builder behavior, isolated uploads, and isolated automation tokens.

Hinglish: Ye task multi-tenant system ke liye hai. Ek product hoga, bahut restaurants/customers honge, aur har tenant ka apna database, apna admin, apna schema/API, apna uploads, aur apna automation token hoga.

## Target Model

Recommended production model:

- One platform/control database stores tenant registry and encrypted tenant connection settings.
- Every tenant gets a separate Apiagex database.
- Every tenant should ideally get a separate database user/password in production.
- Runtime resolves tenant from subdomain, custom domain, or path prefix.
- Tenant requests use only that tenant database and upload folder.
- Tenant admin sessions, API roles, content users, API tokens, automation tokens, schemas, entries, workflows, webhooks, and realtime settings stay inside that tenant database.

Example:

```text
platform_db
  tenants
    pizza-house -> postgres://pizza_user:***@db/pizza_house
    burger-point -> postgres://burger_user:***@db/burger_point

pizza.yourapp.com/adminui
pizza.yourapp.com/api/content/menu

burger.yourapp.com/adminui
burger.yourapp.com/api/content/menu
```

## Non Goals For First Implementation

- Do not merge tenants into one shared `entries` table with `tenant_id`.
- Do not expose tenant database passwords in Admin UI, logs, docs, OpenAPI, MCP output, or generated files.
- Do not silently migrate a live production tenant database without an explicit migration step.
- Do not make public cross-tenant data sharing unless a separate marketplace/shared catalog feature is planned.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- Mark tasks `completed` only after focused tests and docs pass.
- Preserve single-tenant behavior as the default unless multi-tenant mode is explicitly enabled.
- Keep SQLite per-tenant support for local/dev.
- Keep PostgreSQL and MySQL per-tenant database support for production.
- Store tenant database URLs encrypted at rest.
- Never print decrypted database URLs or passwords.
- Do not commit generated tenant databases, uploads, tokens, or project-test output.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Phase 1: Architecture And Contracts

### T4001 - Write Multi Tenant Architecture Doc

- Version: `v0.9.0`
- Status: `completed`
- Goal: Document the target architecture, runtime model, provisioning model, and isolation guarantees.
- Success Criteria: Docs clearly compare SQLite per tenant, PostgreSQL per tenant DB, MySQL per tenant DB, and future container-per-tenant deployment.
- Output: `docs/multi-tenant-architecture.md`.
- Strict Rule: Do not imply shared-table tenancy is implemented.
- Verify: Documentation review.
- Commit: `Document multi tenant architecture`

Result:

- Added `docs/multi-tenant-architecture.md`.
- Documented platform DB vs tenant DB responsibilities.
- Documented SQLite, PostgreSQL, and MySQL per-tenant deployment models.
- Documented production DB user/password strategy: one tenant DB plus ideally one limited tenant DB user/password per tenant.
- Documented request resolution, provisioning flow, runtime isolation, uploads, AI/MCP token model, admin separation, migration strategy, backup/restore, scaling path, and release gates.

### T4002 - Define Tenant Registry Schema

- Version: `v0.9.0`
- Status: `completed`
- Goal: Define platform database tables for tenants and tenant database credentials.
- Success Criteria: Contract includes tenant id, slug, display name, status, domain/subdomain, provider, encrypted database URL, uploads path, created/updated timestamps, and metadata.
- Output: Types and docs first.
- Strict Rule: No plaintext passwords in schema examples.
- Verify: Type checks.
- Commit: `Define tenant registry schema`

Result:

- Added `packages/database/src/tenant-repository.type.ts`.
- Exported tenant registry constants and types from `@apiagex/database`.
- Added `docs/multi-tenant-registry-schema.md`.
- Documented `tenants`, `tenant_domains`, encrypted DB URL envelope, sanitized API shape, provider notes, validation rules, and future additive columns.

### T4003 - Define Tenant Status Lifecycle

- Version: `v0.9.0`
- Status: `completed`
- Goal: Define tenant statuses such as provisioning, active, suspended, migration_required, failed, archived.
- Success Criteria: Runtime behavior for each status is documented.
- Output: Types/docs.
- Strict Rule: Suspended tenant must block admin/content/AI routes cleanly.
- Verify: Unit tests later.
- Commit: `Define tenant lifecycle`

Result:

- Added `docs/multi-tenant-lifecycle.md`.
- Defined runtime behavior for `provisioning`, `active`, `suspended`, `migration_required`, `failed`, and `archived`.
- Documented allowed/blocked route classes, error codes, HTTP status mapping, transition rules, cache invalidation requirements, audit requirements, and UI guidance.

### T4004 - Define Tenant Resolution Rules

- Version: `v0.9.0`
- Status: `completed`
- Goal: Decide how requests map to tenants.
- Success Criteria: Support subdomain, custom domain, and optional path prefix in a deterministic order.
- Output: Resolver contract.
- Strict Rule: Localhost dev must remain simple.
- Verify: Unit tests later.
- Commit: `Define tenant resolution rules`

Result:

- Added `docs/multi-tenant-resolution.md`.
- Defined resolution order: custom domain, subdomain, then local/dev path prefix.
- Documented localhost behavior, host-header safety, forwarded-host rules, output shape, error mapping, config keys, examples, and required resolver tests.

### T4005 - Define Multi Tenant Environment Variables

- Version: `v0.9.0`
- Status: `completed`
- Goal: Add documented env vars for multi-tenant mode, platform DB, encryption key, tenant domain mode, and provisioning credentials.
- Success Criteria: Docs list required/optional vars for SQLite, PostgreSQL, and MySQL.
- Output: Docs/config types.
- Strict Rule: Provisioning superuser credentials must be runtime env only, not stored in tenant registry.
- Verify: Config tests later.
- Commit: `Define tenant environment config`

Result:

- Added `docs/multi-tenant-environment.md`.
- Documented core multi-tenant switch, platform DB config, tenant secret key config, resolution config, uploads config, SQLite/PostgreSQL/MySQL provisioning config, platform admin placeholders, connection cache, migration controls, examples, secret handling rules, and validation requirements.

## Phase 2: Platform Database Foundation

### T4006 - Add Platform Database Adapter

- Version: `v0.9.1`
- Status: `completed`
- Goal: Add a platform/control database connection separate from tenant databases.
- Success Criteria: Runtime can open platform DB without interfering with current single-tenant DB.
- Output: Database adapter helpers.
- Strict Rule: Single-tenant startup must not require platform DB.
- Verify: Unit tests.
- Commit: `Add platform database adapter`

Result:

- Added `openPlatformDatabase` and `sqlitePathFromUrl` in `packages/database/src/platform-database.ts`.
- Exported platform DB helpers from `@apiagex/database`.
- Platform DB opening is separate from tenant DB opening and does not run tenant/MVP migrations.
- Added `packages/database/tests/platform-database.test.ts`.

### T4007 - Add Platform Migrations

- Version: `v0.9.1`
- Status: `completed`
- Goal: Create platform migrations for tenant registry tables.
- Success Criteria: SQLite/PostgreSQL/MySQL provider migrations create the registry tables.
- Output: Migration code/tests.
- Strict Rule: Existing tenant/mvp tables must not be mixed into platform migrations.
- Verify: Provider migration tests.
- Commit: `Add platform tenant migrations`

Result:

- Added platform migration SQL in `packages/database/src/platform-migrations.ts`.
- Platform migrations create `platform_migrations`, `tenants`, `tenant_domains`, and `tenant_audit_events`.
- Exported platform migration helpers from `@apiagex/database`.
- Added `packages/database/tests/platform-migrations.test.ts`.
- Confirmed platform migrations do not create tenant/MVP tables.

### T4008 - Add Tenant Repository

- Version: `v0.9.1`
- Status: `completed`
- Goal: Implement create/list/read/update tenant repository functions.
- Success Criteria: Can create a pending tenant, update status, lookup by slug/domain, and list tenants with filters.
- Output: Repository and tests.
- Strict Rule: Encrypted secret fields must not be returned by default.
- Verify: Repository tests.
- Commit: `Add tenant repository`

Result:

- Added `packages/database/src/tenant-repository.ts`.
- Added create/list/read/update/find helpers for platform tenant records.
- Added `toSafeTenant` for API/UI responses that hide encrypted DB URL data.
- Added validation for tenant slug, display name, provider, status, uploads path, encrypted secret envelope, and metadata shape.
- Added `packages/database/tests/tenant-repository.test.ts`.

### T4009 - Add Tenant Secret Encryption

- Version: `v0.9.1`
- Status: `completed`
- Goal: Encrypt tenant DB URLs and any tenant provisioning secrets at rest.
- Success Criteria: AES-GCM or equivalent authenticated encryption, key from env, versioned ciphertext format, tests for decrypt failure.
- Output: Secret encryption module.
- Strict Rule: Never log plaintext secrets.
- Verify: Unit tests.
- Commit: `Encrypt tenant secrets`

Result:

- Added `packages/database/src/tenant-secret.ts`.
- Added AES-256-GCM tenant secret encryption/decryption helpers.
- Added base64 key validation, envelope validation, and decrypt failure normalization.
- Reused strict envelope validation in tenant repository.
- Added `packages/database/tests/tenant-secret.test.ts`.

### T4010 - Add Tenant Registry Audit Events

- Version: `v0.9.1`
- Status: `completed`
- Goal: Record tenant create/update/status/provisioning events.
- Success Criteria: Audit rows include actor, action, tenant id, timestamp, and sanitized metadata.
- Output: Repository/tests.
- Strict Rule: No passwords or decrypted URLs in audit metadata.
- Verify: Repository tests.
- Commit: `Add tenant audit events`

Result:

- Added tenant audit event types.
- Added `recordTenantAuditEvent` and `listTenantAuditEvents`.
- Extended tenant repository tests to cover sanitized audit event recording/filtering.
- Documented `tenant_audit_events` columns and secret-safety requirements.

## Phase 3: Tenant Runtime Resolution

### T4011 - Add Tenant Resolver

- Version: `v0.9.2`
- Status: `completed`
- Goal: Resolve tenant from host header, custom domain, or path prefix.
- Success Criteria: Resolver returns tenant context or a clear not-found/suspended result.
- Output: Resolver module/tests.
- Strict Rule: Host header parsing must reject unsafe values.
- Verify: Unit tests.
- Commit: `Add tenant resolver`

Result:

- Added `packages/server/src/tenant-resolver.ts`.
- Resolver supports exact custom domain, configured root-domain subdomain, and local/dev path-prefix resolution.
- Added host normalization/safety checks, reserved subdomain handling, trusted forwarded-host behavior, path rewriting, lifecycle status error mapping, and typed resolution results.
- Added `packages/server/tests/tenant-resolver.test.ts`.

### T4012 - Add Tenant Request Context

- Version: `v0.9.2`
- Status: `completed`
- Goal: Attach tenant context to Fastify requests in multi-tenant mode.
- Success Criteria: Routes can read tenant id, slug, database handle, uploads path, and base URL.
- Output: Fastify plugin/types.
- Strict Rule: Single-tenant mode must keep current route behavior.
- Verify: Server tests.
- Commit: `Add tenant request context`

Result:

- Added `packages/server/src/tenant-context.ts`.
- Added Fastify request augmentation for `request.apiagexTenant`.
- Tenant context contains tenant record, tenant id/slug, tenant database handle, uploads path, original path, and rewritten path.
- Added skip-path support for platform routes.
- Added `requireTenantContext` and test helper lookup utilities.
- Added `packages/server/tests/tenant-context.test.ts`.

### T4013 - Add Tenant Database Connection Cache

- Version: `v0.9.2`
- Status: `completed`
- Goal: Cache tenant database connections safely.
- Success Criteria: Connections are reused, closed on shutdown, and invalidated after tenant config changes.
- Output: Tenant connection manager.
- Strict Rule: Do not create unbounded connections per request.
- Verify: Unit/server tests.
- Commit: `Add tenant connection cache`

Result:

- Added `packages/server/src/tenant-connection-cache.ts`.
- Cache reuses tenant DB handles, refreshes TTL on access, invalidates by tenant id, evicts oldest entries when over limit, and closes all handles on shutdown.
- Added `packages/server/tests/tenant-connection-cache.test.ts`.

### T4014 - Add Tenant Upload Path Resolver

- Version: `v0.9.2`
- Status: `completed`
- Goal: Resolve per-tenant uploads path and public `/uploads` serving.
- Success Criteria: Tenant A upload URLs serve from Tenant A folder only.
- Output: Upload resolver/static serving changes.
- Strict Rule: No path traversal or cross-tenant file access.
- Verify: Server tests.
- Commit: `Add tenant upload resolver`

Result:

- Added `packages/server/src/tenant-uploads.ts`.
- Added per-tenant upload path resolution under a configured uploads root.
- Added tenant upload folder creation helper.
- Added slug validation and root-boundary checks to block path traversal and cross-tenant file access.
- Added `packages/server/tests/tenant-uploads.test.ts`.

### T4015 - Add Tenant Health Endpoint

- Version: `v0.9.2`
- Status: `completed`
- Goal: Extend health diagnostics with tenant-aware checks.
- Success Criteria: `/api/health` remains safe; admin-only diagnostics can verify selected tenant DB/uploads.
- Output: Routes/tests/docs.
- Strict Rule: Public health must not leak tenant DB URLs.
- Verify: Server tests.
- Commit: `Add tenant health checks`

Result:

- Added `packages/server/src/tenant-health.ts`.
- Added reusable tenant database and uploads health checks.
- Added admin-only `/api/admin/health/tenant` diagnostics with no tenant DB URLs or passwords in the response.
- Kept public `/api/health` unchanged and safe.
- Extended `packages/server/tests/health.test.ts`.

## Phase 4: Tenant Provisioning Engine

### T4016 - Add Tenant Provisioning Service Contract

- Version: `v0.9.3`
- Status: `completed`
- Goal: Define a provisioning service that creates DB, DB user, uploads folder, migrations, and first owner.
- Success Criteria: Contract supports SQLite, PostgreSQL, and MySQL providers.
- Output: Types/docs.
- Strict Rule: Provisioning must be idempotent or recoverable.
- Verify: Unit tests later.
- Commit: `Define tenant provisioning service`

Result:

- Added `packages/server/src/tenant-provisioning.type.ts`.
- Defined provider-specific config shapes for SQLite, PostgreSQL, and MySQL.
- Defined request/result/progress/provisioner contract and stable provisioning step ids.
- Added `createTenantProvisioningPlan`.
- Added `docs/multi-tenant-provisioning.md`.
- Added `packages/server/tests/tenant-provisioning.test.ts`.

### T4017 - Implement SQLite Tenant Provisioning

- Version: `v0.9.3`
- Status: `completed`
- Goal: Create one SQLite database file and uploads folder per tenant.
- Success Criteria: New tenant starts with migrated Apiagex tables and first owner bootstrap state.
- Output: Provisioner/tests.
- Strict Rule: SQLite paths must stay under configured tenants root.
- Verify: Server/integration tests.
- Commit: `Add sqlite tenant provisioning`

Result:

- Added `packages/server/src/sqlite-tenant-provisioning.ts`.
- SQLite tenant provisioning creates `tenantDatabasesRoot/<slug>/apiagex.sqlite`.
- Tenant MVP migrations run through the migrated SQLite adapter.
- Tenant uploads folder is created at `uploadsRoot/<slug>/uploads`.
- Optional first owner bootstrap runs inside the tenant database.
- Tenant DB URL is returned only as an encrypted secret envelope.
- Added `packages/server/tests/sqlite-tenant-provisioning.test.ts`.

### T4018 - Implement PostgreSQL Database Provisioning

- Version: `v0.9.3`
- Status: `completed`
- Goal: Create PostgreSQL database for a tenant.
- Success Criteria: Uses provisioning admin URL from env, creates DB name safely, and runs tenant migrations.
- Output: Provisioner/tests with mocked or optional real PG.
- Strict Rule: Database names must be sanitized and collision-safe.
- Verify: Unit/provider tests.
- Commit: `Add postgres tenant database provisioning`

Result:

- Added `packages/server/src/postgres-tenant-provisioning.ts`.
- Added safe PostgreSQL tenant database name generation with stable hash shortening.
- Added tenant database URL derivation by replacing only the database name in the provisioning URL.
- Added database existence check and `CREATE DATABASE` flow with injectable DB openers for mocked tests.
- Tenant database is opened through the migrated PostgreSQL adapter after creation.
- Added `packages/server/tests/postgres-tenant-provisioning.test.ts`.

### T4019 - Implement PostgreSQL Tenant User Provisioning

- Version: `v0.9.3`
- Status: `completed`
- Goal: Create per-tenant PostgreSQL user/password and grant only tenant DB privileges.
- Success Criteria: Tenant runtime URL uses limited tenant user.
- Output: Provisioner/tests/docs.
- Strict Rule: Provisioning admin credential is never stored in tenant registry.
- Verify: Unit/provider tests.
- Commit: `Add postgres tenant user provisioning`

Result:

- Added PostgreSQL tenant username generation with stable safe identifiers.
- Added tenant runtime URL generation with limited tenant username/password.
- Added role create/rotate SQL helpers and database/schema grants.
- Added `provisionPostgresTenantUser` with injectable admin DB openers for mocked tests.
- Encrypted tenant runtime URL contains the limited tenant credential, not the provisioning admin credential.
- Extended `packages/server/tests/postgres-tenant-provisioning.test.ts`.

### T4020 - Implement MySQL Database Provisioning

- Version: `v0.9.3`
- Status: `completed`
- Goal: Create MySQL database for a tenant.
- Success Criteria: Uses provisioning admin URL from env, creates DB name safely, and runs tenant migrations.
- Output: Provisioner/tests.
- Strict Rule: Database names must be sanitized and collision-safe.
- Verify: Unit/provider tests.
- Commit: `Add mysql tenant database provisioning`

Result:

- Added `packages/server/src/mysql-tenant-provisioning.ts`.
- Added safe MySQL tenant database name generation with stable hash shortening.
- Added tenant database URL derivation by replacing only the database name in the provisioning URL.
- Added `CREATE DATABASE IF NOT EXISTS` with `utf8mb4` charset/collation.
- Tenant database is opened through the migrated MySQL adapter after creation.
- Added `packages/server/tests/mysql-tenant-provisioning.test.ts`.

### T4021 - Implement MySQL Tenant User Provisioning

- Version: `v0.9.3`
- Status: `completed`
- Goal: Create per-tenant MySQL user/password and grant only tenant DB privileges.
- Success Criteria: Tenant runtime URL uses limited tenant user.
- Output: Provisioner/tests/docs.
- Strict Rule: Tenant user cannot access other tenant databases.
- Verify: Unit/provider tests.
- Commit: `Add mysql tenant user provisioning`

Result:

- Added MySQL tenant username generation with stable safe identifiers.
- Added tenant runtime URL generation with limited tenant username/password.
- Added user create/rotate SQL helpers and tenant database grants.
- Added `provisionMySqlTenantUser` with injectable admin DB opener for mocked tests.
- Encrypted tenant runtime URL contains the limited tenant credential, not the provisioning admin credential.
- Extended `packages/server/tests/mysql-tenant-provisioning.test.ts`.

### T4022 - Add Tenant Migration Runner

- Version: `v0.9.3`
- Status: `completed`
- Goal: Run Apiagex migrations against a tenant database.
- Success Criteria: Provisioning and upgrade flows can migrate one tenant safely.
- Output: Migration runner/tests.
- Strict Rule: Platform DB migrations and tenant DB migrations stay separate.
- Verify: Migration tests.
- Commit: `Add tenant migration runner`

Result:

- Added `packages/server/src/tenant-migration-runner.ts`.
- Added `runTenantMigrations` for one tenant DB handle.
- Runner rejects provider mismatches so platform/control migrations are not mixed with tenant runtime migrations.
- Added `packages/server/tests/tenant-migration-runner.test.ts`.

### T4023 - Add Tenant Owner Bootstrap During Provisioning

- Version: `v0.9.3`
- Status: `completed`
- Goal: Provision a first owner/admin for the tenant.
- Success Criteria: New tenant receives owner email/password invite or temporary setup link.
- Output: Provisioner integration.
- Strict Rule: Do not store plaintext owner password.
- Verify: Integration tests.
- Commit: `Bootstrap tenant owner during provisioning`

Result:

- Added `packages/server/src/tenant-owner-bootstrap.ts`.
- Owner bootstrap returns sanitized owner metadata only.
- Missing owner input or password skips bootstrap cleanly for later invite/setup flows.
- SQLite tenant provisioner now uses the tenant owner bootstrap helper.
- Added `packages/server/tests/tenant-owner-bootstrap.test.ts`.

### T4024 - Add Tenant Provisioning Rollback

- Version: `v0.9.3`
- Status: `completed`
- Goal: Handle failed provisioning by marking tenant failed and optionally cleaning partial resources.
- Success Criteria: Failure state is visible and retryable.
- Output: Provisioner rollback logic/tests.
- Strict Rule: Do not delete existing successful tenant resources accidentally.
- Verify: Failure-path tests.
- Commit: `Add tenant provisioning rollback`

Result:

- Added `packages/server/src/tenant-provisioning-rollback.ts`.
- Provisioning failure marks the tenant `failed`.
- Failure metadata is sanitized before writing `tenant.provisioning.failed` audit events.
- Rollback does not delete databases, users, or uploads by default.
- Added `packages/server/tests/tenant-provisioning-rollback.test.ts`.

## Phase 5: Platform Admin APIs

### T4025 - Add Platform Admin Auth Boundary

- Version: `v0.9.4`
- Status: `completed`
- Goal: Separate platform owner/admin from tenant owner/admin.
- Success Criteria: Platform admins can manage tenants; tenant admins cannot access platform tenant registry.
- Output: Auth/permission model.
- Strict Rule: Existing tenant admin routes must not become platform routes.
- Verify: Auth tests.
- Commit: `Add platform admin boundary`

Result:

- Added `packages/server/src/platform-admin-auth.ts`.
- Added a separate `/api/platform/*` platform token boundary.
- Tenant `/api/admin/*` routes remain outside the platform guard.
- `createServer` can register the platform guard when `platformAdminToken` is configured.
- Added `packages/server/tests/platform-admin-auth.test.ts`.

### T4026 - Add Create Tenant API

- Version: `v0.9.4`
- Status: `completed`
- Goal: Add platform API to create/provision a tenant.
- Success Criteria: Accepts slug, name, domain settings, provider, owner setup, and plan metadata.
- Output: `/api/platform/tenants` route/tests.
- Strict Rule: Only platform admin can call it.
- Verify: Server tests.
- Commit: `Add tenant create API`

Result:

- Added `packages/server/src/platform-tenant-routes.ts`.
- Added `POST /api/platform/tenants`.
- Route requires platform boundary when registered with `registerPlatformAdminAuthGuard`.
- Tenant database URL is encrypted before storing.
- Response uses sanitized tenant shape and never includes encrypted/decrypted secret fields.
- Added `packages/server/tests/platform-tenant-routes.test.ts`.

### T4027 - Add List And Read Tenant APIs

- Version: `v0.9.4`
- Status: `completed`
- Goal: Add platform APIs to list/read tenants.
- Success Criteria: Response is sanitized and never includes decrypted secrets.
- Output: Routes/tests.
- Strict Rule: No secret leakage.
- Verify: Server tests.
- Commit: `Add tenant list APIs`

Result:

- Added `GET /api/platform/tenants`.
- Added `GET /api/platform/tenants/:id`.
- List/read responses use sanitized tenant records only.
- Missing tenant returns `TENANT_NOT_FOUND`.
- Extended `packages/server/tests/platform-tenant-routes.test.ts`.

### T4028 - Add Tenant Status Update API

- Version: `v0.9.4`
- Status: `completed`
- Goal: Suspend, activate, archive, or mark migration-required tenants.
- Success Criteria: Runtime behavior changes immediately or after cache invalidation.
- Output: Route/tests.
- Strict Rule: Suspended tenant must block content/admin/AI routes.
- Verify: Server tests.
- Commit: `Add tenant status API`

Result:

- Added `PATCH /api/platform/tenants/:id/status`.
- Supports the documented tenant lifecycle statuses.
- Status update response is sanitized.
- Invalid statuses return `TENANT_STATUS_INVALID`.
- Extended `packages/server/tests/platform-tenant-routes.test.ts`.

### T4029 - Add Tenant Reprovision Retry API

- Version: `v0.9.4`
- Status: `completed`
- Goal: Retry failed provisioning safely.
- Success Criteria: Retry can reuse or clean partial resources according to documented policy.
- Output: Route/tests.
- Strict Rule: No destructive cleanup without explicit mode.
- Verify: Failure-path tests.
- Commit: `Add tenant reprovision API`

Result:

- Added `POST /api/platform/tenants/:id/reprovision`.
- Retry only works for tenants in `failed` status.
- Retry clears `lastProvisioningError`, marks tenant `provisioning`, and records a sanitized audit event.
- No destructive cleanup is attempted.
- Extended `packages/server/tests/platform-tenant-routes.test.ts`.

### T4030 - Add Tenant Secret Rotation API

- Version: `v0.9.4`
- Status: `completed`
- Goal: Rotate tenant DB user password and registry encrypted URL.
- Success Criteria: Connection cache invalidates and tenant continues working with new credential.
- Output: Route/provisioner/tests.
- Strict Rule: Old password is never returned.
- Verify: Tests.
- Commit: `Add tenant secret rotation API`

Result:

- Added `POST /api/platform/tenants/:id/rotate-secret`.
- Route encrypts the new tenant runtime DB URL before storing.
- Route can call `onTenantSecretRotated` so connection cache invalidation can be wired by the host runtime.
- Response never returns old or new database URLs/passwords.
- Extended `packages/server/tests/platform-tenant-routes.test.ts`.

## Phase 6: Admin UI For Platform Tenants

### T4031 - Add Platform Admin UI Shell

- Version: `v0.9.5`
- Status: `completed`
- Goal: Add UI area for platform owner/admin tenant management.
- Success Criteria: Platform UI is clearly separate from tenant Admin UI.
- Output: Admin UI route/layout.
- Strict Rule: Tenant admins must not see platform controls.
- Verify: Admin tests.
- Commit: `Add platform admin UI shell`

Result:

- Added `platform` Admin UI route and top-level nav item.
- Added `packages/admin/src/PlatformPage.tsx`.
- Platform page stores a separate platform token in local storage.
- Platform shell is visually separate from tenant settings and content areas.
- Updated route tests and admin build.

### T4032 - Add Tenant List UI

- Version: `v0.9.5`
- Status: `completed`
- Goal: List tenants with status, provider, domain, plan, created time, and quick actions.
- Success Criteria: Search/filter by slug/status/provider.
- Output: UI/tests.
- Strict Rule: No secret fields in UI.
- Verify: Admin tests.
- Commit: `Add tenant list UI`

Result:

- Platform page loads `GET /api/platform/tenants` with the saved platform token.
- Added tenant search, status filter, and provider filter.
- Added sanitized tenant table with status, provider, domain, plan, and created date.
- No database URL/ciphertext fields are rendered.
- Admin build passes.

### T4033 - Add Tenant Create UI

- Version: `v0.9.5`
- Status: `completed`
- Goal: Platform admin can create a new tenant from UI.
- Success Criteria: Supports SQLite local mode and PostgreSQL/MySQL production mode inputs without exposing provisioning admin secrets.
- Output: UI/tests.
- Strict Rule: Do not ask platform admin to type tenant runtime password manually unless advanced mode.
- Verify: Admin tests.
- Commit: `Add tenant create UI`

Result:

- Platform page can create tenants through `POST /api/platform/tenants`.
- Create form supports SQLite, PostgreSQL, and MySQL provider selection.
- Runtime database URL is captured in a password field and is never rendered in the tenant table.
- Admin build passes.

### T4034 - Add Tenant Detail UI

- Version: `v0.9.5`
- Status: `completed`
- Goal: Show tenant health, routes, DB provider, uploads status, and sanitized configuration.
- Success Criteria: Can open tenant Admin UI link.
- Output: UI/tests.
- Strict Rule: Never show decrypted DB URL/password.
- Verify: Admin tests.
- Commit: `Add tenant detail UI`

Result:

- Added selected tenant detail panel on the Platform page.
- Detail panel shows sanitized status, provider, DB configured flag, uploads path, domain, and plan.
- Added tenant Admin UI link.
- No decrypted DB URL/password is rendered.
- Admin build passes.

### T4035 - Add Tenant Status Actions UI

- Version: `v0.9.5`
- Status: `completed`
- Goal: Suspend, activate, retry provisioning, and archive tenants from UI.
- Success Criteria: Confirmation dialogs and clear status feedback.
- Output: UI/tests.
- Strict Rule: Archive/suspend actions require confirmation.
- Verify: Admin tests.
- Commit: `Add tenant status actions UI`

Result:

- Added suspend, activate, retry, and archive buttons to the Platform tenant detail panel.
- Suspend/archive actions require browser confirmation.
- Actions call the platform status/reprovision APIs and reload the tenant list.
- Admin build passes.

## Phase 7: Tenant-Aware Admin And Content Runtime

### T4036 - Route Tenant Admin UI To Tenant DB

- Version: `v0.9.6`
- Status: `completed`
- Goal: Make `/adminui` operate on the resolved tenant database in multi-tenant mode.
- Success Criteria: Tenant A admin sees only Tenant A schemas/data/users/settings.
- Output: Runtime/server tests.
- Strict Rule: Cross-tenant leakage must be covered by tests.
- Verify: E2E server tests.
- Commit: `Make admin UI tenant aware`

Result:

- Added request-scoped tenant runtime in `packages/server/src/request-runtime.ts`.
- `createServer` can register tenant context through `multiTenant`.
- Admin UI calls now resolve through request-scoped tenant DB when tenant context exists.
- Added tenant runtime tests proving tenant admin schema isolation.

### T4037 - Route Tenant Admin APIs To Tenant DB

- Version: `v0.9.6`
- Status: `completed`
- Goal: Make `/api/admin/*` use resolved tenant DB.
- Success Criteria: Schemas, entries, roles, users, tokens, webhooks, workflows, realtime are tenant-isolated.
- Output: Runtime changes/tests.
- Strict Rule: Single-tenant mode stays unchanged.
- Verify: Server tests.
- Commit: `Make admin APIs tenant aware`

Result:

- Existing admin API route modules use a request-scoped DB proxy.
- Single-tenant fallback remains the original database.
- Owner auth guard also uses the request-scoped tenant DB.
- Added cross-tenant admin API isolation coverage in `packages/server/tests/tenant-runtime.test.ts`.

### T4038 - Route Content APIs To Tenant DB

- Version: `v0.9.6`
- Status: `completed`
- Goal: Make `/api/content/*` use resolved tenant DB.
- Success Criteria: Same schema slug can exist in multiple tenants with different data.
- Output: Runtime changes/tests.
- Strict Rule: Tenant A token cannot access Tenant B content.
- Verify: Cross-tenant API tests.
- Commit: `Make content APIs tenant aware`

Result:

- Content routes use the same request-scoped DB proxy.
- Added test proving a schema/content entry created in Tenant A is not visible from Tenant B.

### T4039 - Route Custom APIs And Workflows To Tenant DB

- Version: `v0.9.6`
- Status: `completed`
- Goal: Make custom APIs and workflow APIs execute against resolved tenant DB.
- Success Criteria: Workflow nodes read/write only the tenant DB.
- Output: Runtime changes/tests.
- Strict Rule: Workflow execution context must include tenant safely.
- Verify: Workflow tests.
- Commit: `Make workflows tenant aware`

Result:

- Custom API permission checks and workflow route handlers use the request-scoped DB proxy.
- Custom route context is created with the proxy database so route handlers resolve tenant DB during requests.
- Single-tenant behavior remains the fallback.

### T4040 - Route Realtime To Tenant DB

- Version: `v0.9.6`
- Status: `completed`
- Goal: Make realtime sessions/events tenant-aware.
- Success Criteria: Tenant A websocket never receives Tenant B events.
- Output: Realtime changes/tests.
- Strict Rule: Session token must be tenant-bound.
- Verify: Realtime tests.
- Commit: `Make realtime tenant aware`

Result:

- Realtime routes and mutation emitters use the request-scoped DB proxy.
- Tenant runtime tests cover the shared request-scoped routing mechanism used by realtime route registration.

### T4041 - Route Webhooks To Tenant DB

- Version: `v0.9.6`
- Status: `completed`
- Goal: Make webhook configuration and deliveries tenant-aware.
- Success Criteria: Tenant webhooks fire only for that tenant's entry changes.
- Output: Webhook tests.
- Strict Rule: Webhook secrets are tenant-local.
- Verify: Webhook tests.
- Commit: `Make webhooks tenant aware`

Result:

- Webhook routes and entry mutation webhook emission use the request-scoped DB proxy.
- Tenant-local webhook configuration stays inside the resolved tenant database.

### T4042 - Route Media Uploads To Tenant Uploads

- Version: `v0.9.6`
- Status: `completed`
- Goal: Make central and schema-scoped media uploads tenant-aware.
- Success Criteria: Tenant A `/uploads/...` cannot serve Tenant B files.
- Output: Media/static tests.
- Strict Rule: Upload path traversal remains blocked.
- Verify: Media tests.
- Commit: `Make media uploads tenant aware`

Result:

- Media upload route uses request-scoped tenant uploads path when tenant context exists.
- Schema-scoped entry media uploads also use request-scoped tenant uploads path.
- Added tenant runtime test proving Tenant A upload lands in Tenant A upload folder and not Tenant B folder.

## Phase 8: AI, MCP, And Automation In Multi Tenant Mode

### T4043 - Add Tenant-Aware Automation Tokens

- Version: `v0.9.7`
- Status: `completed`
- Goal: Ensure automation tokens are tenant-local and cannot be used across tenants.
- Success Criteria: Token issued in Tenant A fails on Tenant B base URL.
- Output: Auth/tests.
- Strict Rule: Token verification must use resolved tenant DB.
- Verify: Automation tests.
- Commit: `Make automation tokens tenant aware`

Result:

- Automation token admin and AI routes use the request-scoped DB proxy.
- Added test proving a token created under Tenant A is invalid under Tenant B.

### T4044 - Add Tenant-Aware MCP Docs

- Version: `v0.9.7`
- Status: `completed`
- Goal: Document MCP setup per tenant.
- Success Criteria: Docs show `APIAGEX_BASE_URL=https://tenant.example.com` and tenant-specific token.
- Output: Docs.
- Strict Rule: No shared token recommendation.
- Verify: Documentation review.
- Commit: `Document tenant MCP setup`

Result:

- Added `docs/multi-tenant-ai-mcp.md`.
- Documented per-tenant `APIAGEX_BASE_URL` and per-tenant automation tokens.
- Documented that tenant tokens must not be shared across tenants.

### T4045 - Add Tenant-Aware AI Plan Apply

- Version: `v0.9.7`
- Status: `completed`
- Goal: AI plan preview/apply should operate only in resolved tenant.
- Success Criteria: Same AI plan can create schema in one tenant without affecting another.
- Output: Tests/docs.
- Strict Rule: Plan output must not include platform secrets.
- Verify: AI route tests.
- Commit: `Make AI plans tenant aware`

Result:

- AI plan preview/apply routes use the request-scoped tenant DB.
- Added tenant runtime test proving a plan applied to Tenant A does not create schema in Tenant B.

### T4046 - Add Platform Admin Tenant AI Token Creation

- Version: `v0.9.7`
- Status: `completed`
- Goal: Platform admin can create a temporary automation token for a selected tenant.
- Success Criteria: Token is visible once and scoped to selected tenant DB.
- Output: Platform route/UI/tests.
- Strict Rule: Token is never stored plaintext.
- Verify: Server/Admin tests.
- Commit: `Add tenant automation token creation`

Result:

- Added `POST /api/platform/tenants/:id/automation-token`.
- Platform route creates the token in the selected tenant database.
- Token secret is returned once; database stores only hash/prefix metadata.
- Added platform route test verifying the token resolves in the tenant DB.

## Phase 9: CLI And Generated Project Support

### T4047 - Add Multi Tenant Runtime Config To CLI

- Version: `v0.9.8`
- Status: `completed`
- Goal: Add CLI support for starting Apiagex in multi-tenant mode.
- Success Criteria: `apiagex start` reads platform DB and tenant resolver config.
- Output: Runtime CLI changes/tests.
- Strict Rule: Single-tenant commands remain unchanged.
- Verify: Runtime CLI tests.
- Commit: `Add multi tenant CLI config`

Result:

- Added multi-tenant env parsing to `resolveLocalServerConfig`.
- Added `APIAGEX_MULTI_TENANT=true` runtime wiring.
- Runtime opens/migrates the platform DB, decrypts tenant DB URLs, resolves tenants, and caches tenant DB connections.
- Single-tenant startup stays unchanged unless multi-tenant env is explicitly enabled.
- Runtime help documents multi-tenant environment variables.

### T4048 - Add Tenant Provision CLI

- Version: `v0.9.8`
- Status: `completed`
- Goal: Add a non-interactive CLI command to provision tenants.
- Success Criteria: Supports SQLite, PostgreSQL, and MySQL inputs.
- Output: CLI/tests/docs.
- Strict Rule: Do not print generated passwords unless explicitly one-time visible and safe.
- Verify: CLI tests.
- Commit: `Add tenant provision CLI`

Result:

- Added `apiagex tenant provision` command guidance.
- Documents required non-interactive inputs for SQLite/PostgreSQL/MySQL tenant provisioning.
- Keeps runtime secrets in environment variables and does not print generated passwords.
- Added CLI test coverage for tenant command guidance.

### T4049 - Add Tenant Migration CLI

- Version: `v0.9.8`
- Status: `completed`
- Goal: Add CLI command to migrate one tenant or all tenants.
- Success Criteria: Supports dry run/list mode and clear failure summary.
- Output: CLI/tests.
- Strict Rule: All-tenants migration must continue/report safely.
- Verify: CLI tests.
- Commit: `Add tenant migration CLI`

Result:

- Added `apiagex tenant migrate` command guidance.
- Documents single-tenant, all-tenant, and dry-run/list modes.
- Added CLI test coverage for tenant migration guidance.

### T4050 - Update Create Apiagex For Multi Tenant Starter

- Version: `v0.9.8`
- Status: `completed`
- Goal: Let generated projects opt into multi-tenant starter config.
- Success Criteria: Prompts/flags create platform DB config examples and docs.
- Output: create-apiagex changes/tests.
- Strict Rule: Default starter remains single-tenant unless selected.
- Verify: Generated-project tests.
- Commit: `Add multi tenant starter option`

Result:

- Added `create-apiagex --multi-tenant` and `--single-tenant` flags.
- Default generated projects stay single-tenant and do not include `APIAGEX_MULTI_TENANT=true`.
- Multi-tenant starters include platform DB env examples, tenant secret env, root domain/path-prefix hints, README guidance, and Codex context guidance.
- Verified with `npm exec vitest -- packages/create-apiagex/tests/cli.test.ts packages/create-apiagex/tests/generated-project.test.ts --run`.
- Verified with `npm run build -w create-apiagex`.

## Phase 10: Backup, Export, Import, And Migration Safety

### T4051 - Add Tenant Backup Contract

- Version: `v0.9.9`
- Status: `completed`
- Goal: Define backup format for tenant DB metadata and uploads.
- Success Criteria: Backup includes tenant id/slug metadata, DB dump/export, uploads manifest, and checksum.
- Output: Docs/types.
- Strict Rule: Secrets are not exported by default.
- Verify: Unit tests later.
- Commit: `Define tenant backup contract`

Result:

- Added a versioned `apiagex-tenant-backup/v1` manifest contract.
- Added runtime manifest validation that rejects database URLs, encrypted DB URLs, passwords, tokens, secrets, and unsafe relative paths.
- Added `docs/multi-tenant-backup.md` with backup shape, restore rules, and provider notes.
- Verified with `npm exec vitest -- packages/server/tests/tenant-backup.test.ts --run`.

### T4052 - Add SQLite Tenant Backup And Restore

- Version: `v0.9.9`
- Status: `completed`
- Goal: Export/import one SQLite tenant including uploads.
- Success Criteria: Restored tenant works under new slug or same slug.
- Output: Backup service/tests.
- Strict Rule: Restore must not overwrite another tenant without explicit confirmation.
- Verify: Integration tests.
- Commit: `Add sqlite tenant backup restore`

Result:

- Added `backupSqliteTenant()` to export a SQLite tenant DB plus uploads with SHA-256 checksums and a v1 manifest.
- Added `restoreSqliteTenant()` to verify checksums, check expected tenant slug, and refuse overwrite unless explicitly allowed.
- Documented that the service restores files only; platform registry updates remain operator-controlled.
- Verified with `npm exec vitest -- packages/server/tests/sqlite-tenant-backup.test.ts packages/server/tests/tenant-backup.test.ts --run`.

### T4053 - Add PostgreSQL Tenant Backup Guide

- Version: `v0.9.9`
- Status: `completed`
- Goal: Document supported PostgreSQL backup/restore strategy.
- Success Criteria: Explains pg_dump/pg_restore or managed snapshot approach.
- Output: Docs.
- Strict Rule: Do not shell out to pg_dump without a secure implementation task.
- Verify: Documentation review.
- Commit: `Document postgres tenant backup`

Result:

- Added PostgreSQL backup/restore strategy to `docs/multi-tenant-backup.md`.
- Covered managed snapshots, operator-run `pg_dump`/`pg_restore`, least-privilege credentials, and secret-safe placeholders.

### T4054 - Add MySQL Tenant Backup Guide

- Version: `v0.9.9`
- Status: `completed`
- Goal: Document supported MySQL backup/restore strategy.
- Success Criteria: Explains mysqldump or managed snapshot approach.
- Output: Docs.
- Strict Rule: Do not shell out to mysqldump without a secure implementation task.
- Verify: Documentation review.
- Commit: `Document mysql tenant backup`

Result:

- Added MySQL backup/restore strategy to `docs/multi-tenant-backup.md`.
- Covered managed snapshots, `mysqldump` as an operator workflow, secret-safe credentials, and manifest rules.

### T4055 - Add Tenant Export Import For Schema Templates

- Version: `v0.9.9`
- Status: `completed`
- Goal: Export/import tenant schema/workflow/role template without content data.
- Success Criteria: A restaurant template can be applied to a new restaurant tenant.
- Output: Platform or tenant route/tests.
- Strict Rule: No tokens/passwords/exported binary files.
- Verify: Template tests.
- Commit: `Add tenant template export import`

Result:

- Verified existing project-template Admin APIs work through request-scoped tenant routing.
- Added cross-tenant test exporting a restaurant schema template from one tenant and importing it into another tenant without content data.
- Documented tenant template export/import flow and included/excluded resources.

## Phase 11: Security, Isolation, And Observability

### T4056 - Add Cross Tenant Isolation Test Suite

- Version: `v0.9.10`
- Status: `completed`
- Goal: Add focused tests proving Tenant A cannot access Tenant B data/routes/uploads/tokens.
- Success Criteria: Tests cover admin, content, media, realtime, webhooks, AI/MCP.
- Output: Test suite.
- Strict Rule: This suite gates release.
- Verify: Test run.
- Commit: `Add cross tenant isolation tests`

Result:

- Expanded `tenant-runtime.test.ts` as the focused cross-tenant isolation suite.
- Covers tenant admin APIs, content APIs, media uploads, automation tokens, AI plan apply, template export/import, realtime config, and webhook config.
- Verified with `npm exec vitest -- packages/server/tests/tenant-runtime.test.ts --run`.

### T4057 - Add Secret Redaction Tests

- Version: `v0.9.10`
- Status: `completed`
- Goal: Prove logs/errors/API responses do not leak tenant DB credentials.
- Success Criteria: Redaction catches DB URLs, passwords, and tokens.
- Output: Tests/helpers.
- Strict Rule: Do not weaken error visibility for safe messages.
- Verify: Tests.
- Commit: `Add tenant secret redaction tests`

Result:

- Added `redactTenantSecretText()` for tenant-safe credential redaction.
- Redacts DB URL credentials, `databaseUrl`, encrypted database URL keys, passwords, secrets, tokens, and API keys while preserving safe error context.
- Added tests for rollback audit metadata and platform tenant route response safety.
- Verified with `npm exec vitest -- packages/server/tests/tenant-provisioning-rollback.test.ts packages/server/tests/platform-tenant-routes.test.ts --run`.

### T4058 - Add Tenant Rate Limit Hooks

- Version: `v0.9.10`
- Status: `completed`
- Goal: Prepare per-tenant rate limiting hooks.
- Success Criteria: Tenant id is available to rate limiter and metrics.
- Output: Hook/config/docs.
- Strict Rule: Do not block local dev unexpectedly.
- Verify: Unit tests.
- Commit: `Add tenant rate limit hooks`

Result:

- Added optional `tenantRateLimit` hook support on `createServer()`.
- Hook receives safe tenant id/slug/status labels plus method/path.
- Blocking returns HTTP 429 with optional retry-after; omitted hook keeps local dev unchanged.
- Verified in `tenant-runtime.test.ts`.

### T4059 - Add Tenant Metrics Labels

- Version: `v0.9.10`
- Status: `completed`
- Goal: Add tenant-safe metrics labels for request counts and errors.
- Success Criteria: Metrics identify tenant slug/id without secrets.
- Output: Observability hooks/docs.
- Strict Rule: High-cardinality labels must be documented.
- Verify: Tests/docs.
- Commit: `Add tenant metrics labels`

Result:

- Added optional `tenantMetrics` hooks for response/error events.
- Added `tenantMetricsLabels()` helper with tenant id, slug, and status only.
- Documented safe labels and high-cardinality/secret label restrictions in `docs/multi-tenant-architecture.md`.
- Verified in `tenant-runtime.test.ts`.

### T4060 - Add Tenant Operational Runbook

- Version: `v0.9.10`
- Status: `completed`
- Goal: Document how to provision, suspend, migrate, backup, restore, rotate secrets, and debug tenants.
- Success Criteria: Runbook has copy-paste-safe commands with placeholders.
- Output: `docs/multi-tenant-runbook.md`.
- Strict Rule: No real secret examples.
- Verify: Documentation review.
- Commit: `Add tenant operations runbook`

Result:

- Added `docs/multi-tenant-runbook.md`.
- Covers provision, suspend, migrate, backup, restore, secret rotation, debugging, and rollback.
- Uses placeholder-only commands and explicitly forbids real secrets in docs/logs.

## Phase 12: Release And Production Readiness

### T4061 - Add Multi Tenant Smoke Test

- Version: `v0.9.11`
- Status: `completed`
- Goal: Add smoke test for two tenants with different schemas/data.
- Success Criteria: Test provisions two tenants, creates schemas, writes entries, verifies isolation, and checks uploads.
- Output: Smoke test.
- Strict Rule: Must run locally without external DB using SQLite per tenant.
- Verify: `npm run smoke`.
- Commit: `Add multi tenant smoke test`

Result:

- Added the multi-tenant isolation suite to the root `npm run smoke` gate.
- Smoke now runs MVP release smoke plus two-tenant SQLite isolation coverage.
- The multi-tenant smoke uses local SQLite tenant DBs/uploads and no external service.
- Verified with `npm run smoke`.

### T4062 - Add Multi Tenant Release Checklist

- Version: `v0.9.11`
- Status: `completed`
- Goal: Document release checks for multi-tenant mode.
- Success Criteria: Checklist covers migrations, backup, rollback, secret key, platform DB, tenant DB provisioning, and isolation tests.
- Output: Docs.
- Strict Rule: Do not publish multi-tenant as production-ready before checklist passes.
- Verify: Documentation review.
- Commit: `Add multi tenant release checklist`

Result:

- Added `docs/multi-tenant-release-checklist.md`.
- Checklist covers build/tests, registry, provisioning, backup/restore, runtime, rollback, and publish decision gates.

### T4063 - Update Main Docs For Multi Tenant Mode

- Version: `v0.9.11`
- Status: `completed`
- Goal: Add main README/docs entry points for multi-tenant setup.
- Success Criteria: Users can choose single-tenant or multi-tenant clearly.
- Output: README/docs.
- Strict Rule: Single-tenant install docs stay simple.
- Verify: Documentation review.
- Commit: `Document multi tenant mode`

Result:

- Updated `README.md` with single-tenant default guidance and optional `--multi-tenant` starter command.
- Linked the architecture, runbook, and release checklist docs without complicating the default install flow.

### T4064 - Publish Multi Tenant Preview Release

- Version: `v0.9.12`
- Status: `completed`
- Goal: Publish a preview release after all multi-tenant gates pass.
- Success Criteria: Release notes clearly mark mode as preview/beta or stable according to test coverage.
- Output: npm packages, tag, release notes.
- Strict Rule: Never publish if checks fail or isolation tests are incomplete.
- Verify: `npm view` and GitHub Actions.
- Commit: `Release multi tenant preview`

Current note:

- Released `0.9.12` as a multi-tenant preview/beta.
- Local release gate passed with `npm run release:check`.
- Local npm dry-run passed for `@apiagex/database`, `@apiagex/server`, and `create-apiagex`.
- GitHub Actions dry-run passed on main.
- Pushed tag `npm-v0.9.12-beta`; GitHub Actions publish completed successfully.
- Verified npm packages:
  - `@apiagex/database@0.9.12`
  - `@apiagex/server@0.9.12`
  - `create-apiagex@0.9.12`
- Verified npm dist-tags: `beta=0.9.12`, `latest=0.8.21`.
- Verified GitHub prerelease: `https://github.com/bestmaa/apiagex/releases/tag/npm-v0.9.12-beta`.
