# Multi Tenant Environment Variables

Multi-tenant mode must be explicit. Single-tenant Apiagex should remain the default when these variables are not enabled.

Hinglish: Agar multi-tenant env enable nahi hai to Apiagex normal single-project mode me hi chalega. Multi-tenant mode ko explicitly on karna hoga.

## Core Switch

```text
APIAGEX_MULTI_TENANT_MODE=false
```

Values:

- `false`: default single-tenant behavior.
- `true`: enable tenant registry, tenant resolution, and tenant database routing.

## Platform Database

```text
APIAGEX_PLATFORM_DATABASE_PROVIDER=sqlite
APIAGEX_PLATFORM_DATABASE_URL=file:./data/platform.sqlite
```

Provider values:

```text
sqlite
postgres
mysql
```

The platform database stores tenant registry records and encrypted tenant database URLs. It does not store tenant content.

## Encryption

```text
APIAGEX_TENANT_SECRET_KEY=base64-32-byte-key
APIAGEX_TENANT_SECRET_KEY_ID=platform-key-2026-05
```

Rules:

- Required when multi-tenant mode is enabled.
- Must be provided by the runtime environment or secret manager.
- Must not be committed to source control.
- Used to encrypt/decrypt tenant runtime database URLs.
- Key rotation is a later task.

## Tenant Resolution

```text
APIAGEX_TENANT_RESOLUTION=domain,subdomain,path
APIAGEX_TENANT_ROOT_DOMAIN=yourapp.com
APIAGEX_TENANT_PATH_PREFIX=/t
APIAGEX_TENANT_ALLOW_SLUG_SUBDOMAIN=true
APIAGEX_TENANT_RESERVED_SUBDOMAINS=www,api,admin,platform,status,static,assets,docs
APIAGEX_TRUST_PROXY=false
```

Notes:

- `domain` means exact custom domain lookup.
- `subdomain` means `tenant.yourapp.com` lookup.
- `path` means local/dev paths like `/t/tenant-slug`.
- `APIAGEX_TRUST_PROXY=true` is required before using forwarded host headers.

## Tenant Uploads

```text
APIAGEX_TENANT_UPLOADS_ROOT=./tenants
APIAGEX_TENANT_UPLOADS_MODE=filesystem
```

Filesystem shape:

```text
./tenants/
  pizza-house/
    data/
    uploads/
```

Future object storage keys may include:

```text
APIAGEX_TENANT_UPLOADS_MODE=s3
APIAGEX_TENANT_UPLOADS_BUCKET=apiagex-tenants
APIAGEX_TENANT_UPLOADS_PREFIX=tenants
```

Object storage is not part of the first implementation unless a later task explicitly adds it.

## SQLite Tenant Provisioning

```text
APIAGEX_TENANT_SQLITE_ROOT=./tenants
```

Tenant SQLite files should be created under this root only:

```text
./tenants/{tenantSlug}/data/apiagex.sqlite
```

No DB username/password is needed for SQLite.

## PostgreSQL Tenant Provisioning

```text
APIAGEX_TENANT_POSTGRES_PROVISIONING_URL=postgres://admin:password@db.example.com:5432/postgres
APIAGEX_TENANT_POSTGRES_DATABASE_PREFIX=agx_
APIAGEX_TENANT_POSTGRES_USER_PREFIX=agx_
APIAGEX_TENANT_POSTGRES_RUNTIME_HOST=db.example.com
APIAGEX_TENANT_POSTGRES_RUNTIME_PORT=5432
APIAGEX_TENANT_POSTGRES_SSL=true
```

Rules:

- Provisioning URL is used only to create DBs/users/grants.
- Provisioning URL must come from env or secret manager.
- Provisioning URL must never be stored in tenant registry.
- Tenant runtime URL is generated with the limited tenant DB user and stored encrypted.

## MySQL Tenant Provisioning

```text
APIAGEX_TENANT_MYSQL_PROVISIONING_URL=mysql://admin:password@db.example.com:3306/mysql
APIAGEX_TENANT_MYSQL_DATABASE_PREFIX=agx_
APIAGEX_TENANT_MYSQL_USER_PREFIX=agx_
APIAGEX_TENANT_MYSQL_RUNTIME_HOST=db.example.com
APIAGEX_TENANT_MYSQL_RUNTIME_PORT=3306
APIAGEX_TENANT_MYSQL_SSL=true
```

Rules:

- Provisioning URL is used only to create DBs/users/grants.
- Provisioning URL must come from env or secret manager.
- Provisioning URL must never be stored in tenant registry.
- Tenant runtime URL is generated with the limited tenant DB user and stored encrypted.

## Platform Admin

Platform admin auth will be defined in later tasks, but config should reserve these names:

```text
APIAGEX_PLATFORM_ADMIN_ENABLED=true
APIAGEX_PLATFORM_ADMIN_BOOTSTRAP_EMAIL=owner@example.com
APIAGEX_PLATFORM_ADMIN_BOOTSTRAP_PASSWORD=temporary-password
```

Rules:

- Bootstrap password may be accepted only for first setup.
- Password must be hashed before storage.
- Password must not be printed or written to generated docs.

## Connection Cache

```text
APIAGEX_TENANT_DB_CACHE_MAX=50
APIAGEX_TENANT_DB_CACHE_TTL_SECONDS=300
```

Rules:

- Tenant DB connections should be reused.
- Cache must be invalidated when tenant status or DB URL changes.
- Cache must close connections on server shutdown.

## Migration Controls

```text
APIAGEX_TENANT_AUTO_MIGRATE=false
APIAGEX_TENANT_MIGRATION_BATCH_SIZE=5
```

Rules:

- Auto-migrate should be off by default in production.
- Tenant migrations should run explicitly through platform admin or CLI.
- SQLite local/dev can allow auto-migrate when configured.

## Example: Local SQLite Multi Tenant

```text
APIAGEX_MULTI_TENANT_MODE=true
APIAGEX_PLATFORM_DATABASE_PROVIDER=sqlite
APIAGEX_PLATFORM_DATABASE_URL=file:./data/platform.sqlite
APIAGEX_TENANT_SECRET_KEY=base64-32-byte-key
APIAGEX_TENANT_SECRET_KEY_ID=local-dev-key
APIAGEX_TENANT_RESOLUTION=path
APIAGEX_TENANT_PATH_PREFIX=/t
APIAGEX_TENANT_SQLITE_ROOT=./tenants
APIAGEX_TENANT_UPLOADS_ROOT=./tenants
```

Example URL:

```text
http://127.0.0.1:4000/t/pizza-house/adminui
```

## Example: PostgreSQL SaaS

```text
APIAGEX_MULTI_TENANT_MODE=true
APIAGEX_PLATFORM_DATABASE_PROVIDER=postgres
APIAGEX_PLATFORM_DATABASE_URL=postgres://platform_user:password@db.example.com:5432/apiagex_platform
APIAGEX_TENANT_SECRET_KEY=base64-32-byte-key
APIAGEX_TENANT_SECRET_KEY_ID=prod-key-2026-05
APIAGEX_TENANT_RESOLUTION=domain,subdomain
APIAGEX_TENANT_ROOT_DOMAIN=yourapp.com
APIAGEX_TENANT_UPLOADS_ROOT=/var/lib/apiagex/tenants
APIAGEX_TENANT_POSTGRES_PROVISIONING_URL=postgres://provisioner:password@db.example.com:5432/postgres
APIAGEX_TENANT_POSTGRES_DATABASE_PREFIX=agx_
APIAGEX_TENANT_POSTGRES_USER_PREFIX=agx_
```

## Example: MySQL SaaS

```text
APIAGEX_MULTI_TENANT_MODE=true
APIAGEX_PLATFORM_DATABASE_PROVIDER=mysql
APIAGEX_PLATFORM_DATABASE_URL=mysql://platform_user:password@db.example.com:3306/apiagex_platform
APIAGEX_TENANT_SECRET_KEY=base64-32-byte-key
APIAGEX_TENANT_SECRET_KEY_ID=prod-key-2026-05
APIAGEX_TENANT_RESOLUTION=domain,subdomain
APIAGEX_TENANT_ROOT_DOMAIN=yourapp.com
APIAGEX_TENANT_UPLOADS_ROOT=/var/lib/apiagex/tenants
APIAGEX_TENANT_MYSQL_PROVISIONING_URL=mysql://provisioner:password@db.example.com:3306/mysql
APIAGEX_TENANT_MYSQL_DATABASE_PREFIX=agx_
APIAGEX_TENANT_MYSQL_USER_PREFIX=agx_
```

## Secret Handling Rules

Never print these values:

- `APIAGEX_TENANT_SECRET_KEY`
- `APIAGEX_PLATFORM_DATABASE_URL`
- `APIAGEX_TENANT_POSTGRES_PROVISIONING_URL`
- `APIAGEX_TENANT_MYSQL_PROVISIONING_URL`
- Decrypted tenant runtime DB URLs.
- Generated tenant DB passwords.

Safe logs can say:

```text
Platform database: configured
Tenant secret key: configured
Tenant postgres provisioning: configured
```

Unsafe logs:

```text
postgres://user:password@host/db
mysql://user:password@host/db
```

## Validation Requirements

Config validation should reject:

- Multi-tenant mode without platform DB config.
- Multi-tenant mode without tenant secret key.
- `subdomain` resolution without root domain.
- `path` resolution with unsafe path prefix.
- PostgreSQL provisioning without provisioning URL when provider is postgres.
- MySQL provisioning without provisioning URL when provider is mysql.
- Upload roots that resolve outside allowed workspace/root.

## Summary

Multi-tenant mode needs four groups of configuration:

1. Platform DB.
2. Tenant secret encryption.
3. Tenant resolution.
4. Tenant provisioning and uploads.

Single-tenant users should not need any of this.
