# Multi Tenant Registry Schema

The tenant registry lives in the platform/control database. It stores tenant routing and encrypted runtime connection settings. It does not store tenant content.

Hinglish: Tenant registry platform DB me rahegi. Ye tenant ko find karne aur uske encrypted DB connection ko store karne ke liye hai. Restaurant ka actual content/data tenant ke apne DB me rahega.

## Tables

First implementation should use these platform tables:

```text
platform_migrations
tenants
tenant_domains
tenant_audit_events
```

`tenant_audit_events` is detailed in a later task, but it should be planned with the registry from the beginning.

## `platform_migrations`

Platform migrations are separate from tenant database migrations.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Platform migration id. |
| `applied_at` | string | yes | ISO timestamp. |

## `tenants`

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string/uuid | yes | Stable tenant id. |
| `slug` | string | yes | URL-safe unique slug, such as `pizza-house`. |
| `display_name` | string | yes | Human readable tenant name. |
| `status` | string | yes | One of `provisioning`, `active`, `suspended`, `migration_required`, `failed`, `archived`. |
| `database_provider` | string | yes | `sqlite`, `postgres`, or `mysql`. |
| `database_url_encrypted_json` | JSON/text | yes | Encrypted tenant runtime DB URL. |
| `uploads_path` | string | yes | Tenant uploads folder or storage prefix. |
| `subdomain` | string/null | no | Optional subdomain label. |
| `primary_domain` | string/null | no | Optional custom domain hostname. |
| `plan` | string/null | no | Product/billing plan label. |
| `metadata_json` | JSON/text | yes | Sanitized non-secret metadata. |
| `last_migration_at` | string/null | no | Last successful tenant DB migration time. |
| `last_provisioning_error` | string/null | no | Sanitized error code/message for failed provisioning. |
| `created_at` | string | yes | ISO timestamp. |
| `updated_at` | string | yes | ISO timestamp. |

Unique indexes:

- `tenants.slug`
- `tenants.subdomain` when not null
- `tenants.primary_domain` when not null

## `tenant_domains`

This table supports multiple custom domains per tenant.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string/uuid | yes | Stable domain record id. |
| `tenant_id` | string/uuid | yes | Tenant id. |
| `hostname` | string | yes | Lowercase hostname. |
| `primary` | boolean/integer | yes | Whether this is the preferred domain. |
| `verified_at` | string/null | no | Verification timestamp. |
| `created_at` | string | yes | ISO timestamp. |
| `updated_at` | string | yes | ISO timestamp. |

Unique indexes:

- `tenant_domains.hostname`

Foreign keys:

- `tenant_domains.tenant_id -> tenants.id`

## `tenant_audit_events`

Tenant audit events record platform actions against tenant registry records.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string/uuid | yes | Stable audit event id. |
| `tenant_id` | string/uuid/null | no | Tenant id when action targets a tenant. |
| `action` | string | yes | Machine-readable action such as `tenant.status.updated`. |
| `actor_id` | string/null | no | Platform actor id when available. |
| `actor_email` | string/null | no | Platform actor email when available. |
| `metadata_json` | JSON/text | yes | Sanitized non-secret metadata. |
| `created_at` | string | yes | ISO timestamp. |

Audit metadata must never include plaintext DB URLs, passwords, API tokens, automation tokens, or webhook secrets.

## Encrypted Secret Shape

Tenant DB URLs must be stored as an encrypted JSON envelope:

```json
{
  "version": 1,
  "algorithm": "aes-256-gcm",
  "keyId": "platform-key-2026-05",
  "iv": "base64-iv",
  "ciphertext": "base64-ciphertext",
  "tag": "base64-auth-tag"
}
```

This encrypted value contains the tenant runtime URL, for example:

```text
postgres://tenant_runtime_user:tenant_password@db.example.com:5432/pizza_house
```

The plaintext URL must never be stored in platform tables, returned from APIs, or printed in logs.

Encryption helpers are exported from `@apiagex/database`:

- `tenantSecretKeyFromBase64`
- `encryptTenantSecret`
- `decryptTenantSecret`
- `assertTenantSecretEnvelope`

## Safe Tenant API Shape

Platform APIs should return sanitized tenant records:

```json
{
  "id": "tenant_123",
  "slug": "pizza-house",
  "displayName": "Pizza House",
  "status": "active",
  "databaseProvider": "postgres",
  "databaseUrlConfigured": true,
  "uploadsPath": "/var/lib/apiagex/tenants/pizza-house/uploads",
  "subdomain": "pizza-house",
  "primaryDomain": "pizza.example.com",
  "plan": "pro",
  "metadata": {},
  "lastMigrationAt": "2026-05-23T00:00:00.000Z",
  "lastProvisioningError": null,
  "createdAt": "2026-05-23T00:00:00.000Z",
  "updatedAt": "2026-05-23T00:00:00.000Z"
}
```

Do not include:

- `databaseUrlEncrypted`
- decrypted DB URL
- DB username
- DB password
- provisioning admin URL
- generated owner password
- API tokens
- automation tokens

## TypeScript Contract

The source type contract is in:

```text
packages/database/src/tenant-repository.type.ts
```

Important exported types:

- `TenantDatabaseProvider`
- `TenantStatus`
- `TenantEncryptedSecret`
- `TenantRecord`
- `TenantSafeRecord`
- `TenantDomainRecord`
- `CreateTenantInput`
- `UpdateTenantInput`
- `TenantLookup`

Repository helpers:

- `createTenant`
- `listTenants`
- `getTenantById`
- `getTenantBySlug`
- `getTenantByDomain`
- `findTenant`
- `updateTenant`
- `toSafeTenant`
- `recordTenantAuditEvent`
- `listTenantAuditEvents`

## Provider Notes

SQLite:

- `database_provider = sqlite`
- Encrypted URL points to a tenant DB file path.
- `uploads_path` points to the tenant uploads folder.

PostgreSQL:

- `database_provider = postgres`
- Encrypted URL uses the tenant runtime DB user, not the provisioning admin user.
- The tenant runtime user should have access only to that tenant database.

MySQL:

- `database_provider = mysql`
- Encrypted URL uses the tenant runtime DB user, not the provisioning admin user.
- The tenant runtime user should have access only to that tenant database.

## Validation Rules

- `slug` should match the existing Apiagex slug style: lowercase, starts with a letter, then letters/numbers/hyphen.
- `subdomain` should be lowercase DNS-label safe.
- `primary_domain` and `tenant_domains.hostname` should be normalized lowercase hostnames.
- `metadata_json` must be JSON object data only.
- `uploads_path` must be resolved under an allowed tenant uploads root unless object storage is explicitly configured later.
- `last_provisioning_error` must be sanitized and must not include passwords, tokens, or DB URLs.

## Future Extensions

Potential columns for later tasks:

- `region`
- `billing_customer_id`
- `storage_provider`
- `storage_bucket`
- `storage_prefix`
- `custom_domain_verification_token_hash`
- `suspended_reason`
- `archived_at`

These should be additive migrations only.
