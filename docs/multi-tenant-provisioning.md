# Multi Tenant Provisioning Contract

Apiagex tenant provisioning is a recoverable workflow that prepares one isolated tenant runtime without exposing database passwords in API responses, logs, template files, or AI/MCP context.

## Contract

The service contract lives in `packages/server/src/tenant-provisioning.type.ts`.

Provisioning input:

- `tenantId`, `slug`, and `displayName` identify the tenant reserved in the platform database.
- `provider` is one of `sqlite`, `postgres`, or `mysql`.
- `actor` records whether the request came from platform admin, automation, or system recovery.
- `owner` can bootstrap the first tenant owner. A caller should prefer `passwordHash` once hashing is available at the boundary.

Provisioning config:

- Every provider needs `secretKey` so the tenant database URL can be encrypted before it is stored.
- SQLite needs `tenantDatabasesRoot` and `uploadsRoot`.
- PostgreSQL needs `provisioningDatabaseUrl`, `uploadsRoot`, and optional database/user prefixes.
- MySQL needs `provisioningDatabaseUrl`, `uploadsRoot`, and optional database/user prefixes.

Provisioning output:

- `tenantId`
- `provider`
- `uploadsPath`
- `encryptedDatabaseUrl`

The result intentionally does not expose plaintext tenant database URLs.

## Steps

Every provider uses the same ordered plan:

1. `reserveTenant`
2. `createDatabase`
3. `createDatabaseUser`
4. `runTenantMigrations`
5. `createUploadsPath`
6. `bootstrapOwner`
7. `activateTenant`

For SQLite, `createDatabaseUser` is marked `skipped` because local SQLite files do not have database users. PostgreSQL and MySQL keep it required in production so each tenant can have a separate limited database user/password.

## Idempotency

Provisioners should be safe to resume after partial failure:

- If a tenant database already exists, verify ownership/name before continuing.
- If a tenant user already exists, rotate or verify credentials according to provider policy.
- If migrations already ran, continue from the latest completed migration.
- If the uploads folder already exists, verify it is under the configured uploads root.
- If owner bootstrap already completed, do not create a duplicate owner.

## Secret Rules

- Provisioning admin URLs must come from runtime environment only.
- Plaintext tenant DB URLs can exist only inside the provisioner while building the encrypted registry secret.
- API responses, audit metadata, progress events, logs, AI context, MCP output, and project templates must use sanitized metadata only.
- The platform database stores only the encrypted tenant DB URL envelope.

## Failure Behavior

When a step fails, the tenant should move to `failed` with a sanitized audit event. The provisioning service may rollback resources it created, but rollback should not hide the original failure. Re-running provisioning for the same tenant should either continue safely or return a clear collision/status error.

`markTenantProvisioningFailed` is the first rollback primitive. It marks the tenant `failed`, writes a sanitized `tenant.provisioning.failed` audit event, and does not delete databases, users, or uploads by default. Cleanup must be explicit in future tasks so an existing successful tenant resource is never removed accidentally.

## SQLite Provisioning

The SQLite provisioner creates:

- `tenantDatabasesRoot/<tenant-slug>/apiagex.sqlite`
- `uploadsRoot/<tenant-slug>/uploads`

Both paths are resolved under their configured roots and tenant slugs must match the safe slug contract. The provisioner opens the new SQLite database through the migrated Apiagex adapter, so tenant MVP tables are ready before the tenant is activated. If the request includes an owner password, the first owner is bootstrapped in the tenant database.

## PostgreSQL Database Provisioning

The PostgreSQL database provisioner uses the runtime `provisioningDatabaseUrl` to connect to an admin database, checks `pg_database`, creates the tenant database when missing, and then opens the tenant database through the migrated PostgreSQL adapter.

Tenant database names are generated from the tenant slug:

- default prefix: `apiagex_`
- example: `pizza-house` becomes `apiagex_pizza_house`
- names are trimmed to PostgreSQL's 63 byte identifier limit with a stable hash suffix

This step intentionally does not create a tenant-specific database user yet; that is the next provisioning step. Until then, the encrypted tenant URL is derived by swapping only the database name in the provisioning URL.

## PostgreSQL Tenant User Provisioning

The PostgreSQL user provisioner creates or rotates one limited runtime role per tenant:

- default username shape: `apiagex_<tenant_slug>_user`
- if the role does not exist, it runs `CREATE ROLE ... LOGIN PASSWORD ...`
- if the role already exists, it rotates the password with `ALTER ROLE`
- it grants access only to the tenant database and the tenant database's `public` schema objects

The provisioning admin URL is used only at runtime. The tenant registry receives an encrypted runtime URL that contains the limited tenant username/password, never the provisioning admin credential.

## Tenant Migration Runner

`runTenantMigrations` runs Apiagex tenant foundation migrations against one tenant database handle. It checks that the requested provider matches the database provider so platform/control database migrations are not accidentally mixed with tenant runtime migrations.

The runner returns the applied migration id and the expected tenant table list. Provisioning can use this after creating a tenant database, and future upgrade flows can use the same function one tenant at a time.

## Tenant Owner Bootstrap

`bootstrapTenantOwner` wraps the existing owner bootstrap flow for provisioning. It accepts the requested owner email/password, creates the first owner inside the tenant database, and returns only sanitized owner metadata:

- `created`
- `email`
- `userId`

The bootstrap result does not return the plaintext password or owner auth token. If no password is supplied, the helper skips owner creation so a later invite/setup-link flow can complete the tenant owner setup.

## MySQL Database Provisioning

The MySQL database provisioner uses the runtime `provisioningDatabaseUrl` to connect to an admin database, runs `CREATE DATABASE IF NOT EXISTS`, and then opens the tenant database through the migrated MySQL adapter.

Tenant database names are generated from the tenant slug:

- default prefix: `apiagex_`
- example: `pizza-house` becomes `apiagex_pizza_house`
- names are trimmed to MySQL's 64 character identifier limit with a stable hash suffix

The created database uses `utf8mb4` and `utf8mb4_unicode_ci` so multilingual content and emoji-capable text work consistently.

## MySQL Tenant User Provisioning

The MySQL user provisioner creates or rotates one limited runtime user per tenant:

- default username shape: `apiagex_<tenant_slug>_user`
- usernames are trimmed to MySQL's 32 character user limit with a stable hash suffix
- it runs `CREATE USER IF NOT EXISTS`, then `ALTER USER` to rotate the password
- it grants CRUD and schema-change privileges only on `<tenant_database>.*`

The provisioning admin URL is used only at runtime. The tenant registry receives an encrypted runtime URL that contains the limited tenant username/password, never the provisioning admin credential.
