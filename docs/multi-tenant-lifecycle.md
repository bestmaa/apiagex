# Multi Tenant Lifecycle

Tenant status controls whether a tenant can receive admin, content, AI/MCP, realtime, webhook, and media requests.

Hinglish: Tenant status batata hai ki restaurant active hai, ban raha hai, suspend hai, migration chahiye, failed hai, ya archived hai. Runtime ko status ke hisab se route allow/block karna hoga.

## Statuses

Apiagex multi-tenant mode uses these statuses:

```text
provisioning
active
suspended
migration_required
failed
archived
```

The TypeScript source is:

```text
packages/database/src/tenant-repository.type.ts
```

## Status Matrix

| Status | Tenant Resolution | Admin UI/API | Content API | AI/MCP | Uploads | Realtime | Webhooks | Typical Use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `provisioning` | found | blocked | blocked | blocked | blocked | blocked | blocked | Tenant resources are still being created. |
| `active` | found | allowed | allowed | allowed | allowed | allowed | allowed | Normal live tenant. |
| `suspended` | found | blocked except platform/admin support views | blocked | blocked | blocked | blocked | outgoing disabled | Billing, abuse, or owner-requested pause. |
| `migration_required` | found | blocked or read-only support mode | blocked | blocked | blocked | blocked | outgoing disabled | Tenant DB must be migrated before use. |
| `failed` | found | blocked except platform retry/debug | blocked | blocked | blocked | blocked | outgoing disabled | Provisioning or migration failed. |
| `archived` | found | blocked except platform restore/export | blocked | blocked | blocked | blocked | disabled | Tenant has been retired. |

## Runtime Behavior

### `provisioning`

The tenant registry row exists, but tenant DB or uploads may not be ready yet.

Runtime should return:

```json
{ "ok": false, "error": "TENANT_PROVISIONING" }
```

Recommended HTTP status:

```text
503 Service Unavailable
```

Allowed operations:

- Platform admin read tenant status.
- Platform admin retry/cancel provisioning when available.

Blocked operations:

- Tenant Admin UI.
- Tenant admin APIs.
- Content APIs.
- AI/MCP routes.
- Media uploads.
- Realtime sessions.
- Webhook delivery.

### `active`

The tenant is live.

Allowed operations:

- Tenant Admin UI.
- Tenant admin APIs.
- Content APIs.
- AI/MCP routes with tenant automation token.
- Media uploads.
- Realtime sessions.
- Webhook delivery.
- Tenant backup/export where permissions allow.

### `suspended`

The tenant exists but should not serve normal traffic.

Runtime should return:

```json
{ "ok": false, "error": "TENANT_SUSPENDED" }
```

Recommended HTTP status:

```text
403 Forbidden
```

Allowed operations:

- Platform admin read tenant status.
- Platform admin reactivate.
- Platform admin backup/export if policy allows.
- Optional tenant owner billing/support page in a later task.

Blocked operations:

- Tenant Admin UI normal app.
- Tenant admin APIs.
- Content APIs.
- AI/MCP routes.
- Media uploads.
- Realtime sessions.
- Webhook delivery.

### `migration_required`

The tenant DB exists, but it is not compatible with the current runtime until migrations run.

Runtime should return:

```json
{ "ok": false, "error": "TENANT_MIGRATION_REQUIRED" }
```

Recommended HTTP status:

```text
503 Service Unavailable
```

Allowed operations:

- Platform admin read tenant status.
- Platform admin run tenant migration.
- Platform admin backup before migration.

Blocked operations:

- Tenant Admin UI normal app.
- Tenant admin APIs.
- Content APIs.
- AI/MCP routes.
- Media uploads.
- Realtime sessions.
- Webhook delivery.

### `failed`

Provisioning or migration failed and requires platform action.

Runtime should return:

```json
{ "ok": false, "error": "TENANT_FAILED" }
```

Recommended HTTP status:

```text
503 Service Unavailable
```

Allowed operations:

- Platform admin inspect sanitized failure.
- Platform admin retry provisioning or migration.
- Platform admin archive tenant.

Blocked operations:

- Tenant Admin UI.
- Tenant admin APIs.
- Content APIs.
- AI/MCP routes.
- Media uploads.
- Realtime sessions.
- Webhook delivery.

### `archived`

The tenant has been retired and should not serve normal traffic.

Runtime should return:

```json
{ "ok": false, "error": "TENANT_ARCHIVED" }
```

Recommended HTTP status:

```text
410 Gone
```

Allowed operations:

- Platform admin read archived tenant.
- Platform admin restore if restore feature is enabled.
- Platform admin export if retention policy allows.

Blocked operations:

- Tenant Admin UI.
- Tenant admin APIs.
- Content APIs.
- AI/MCP routes.
- Media uploads.
- Realtime sessions.
- Webhook delivery.

## Transition Rules

Allowed initial state:

```text
new tenant -> provisioning
```

Allowed normal transitions:

```text
provisioning -> active
provisioning -> failed
failed -> provisioning
active -> suspended
suspended -> active
active -> migration_required
migration_required -> active
migration_required -> failed
failed -> archived
suspended -> archived
active -> archived
archived -> provisioning
archived -> active
```

Restore from `archived` should require explicit platform admin confirmation and may be disabled by policy.

## Tenant Resolution Errors

Tenant status errors are different from tenant not found:

```text
TENANT_NOT_FOUND
TENANT_PROVISIONING
TENANT_SUSPENDED
TENANT_MIGRATION_REQUIRED
TENANT_FAILED
TENANT_ARCHIVED
```

Recommended HTTP mapping:

| Error | HTTP Status |
| --- | --- |
| `TENANT_NOT_FOUND` | 404 |
| `TENANT_PROVISIONING` | 503 |
| `TENANT_SUSPENDED` | 403 |
| `TENANT_MIGRATION_REQUIRED` | 503 |
| `TENANT_FAILED` | 503 |
| `TENANT_ARCHIVED` | 410 |

## Cache Invalidation

Tenant status changes must invalidate tenant context caches.

Examples:

- Suspending a tenant should immediately block new requests.
- Reactivating a tenant should allow new requests after status update.
- Rotating DB credentials should close or refresh tenant DB connection cache.
- Marking migration required should block normal tenant routes until migration succeeds.

## Audit Requirements

Every status transition should create a sanitized tenant audit event:

```json
{
  "tenantId": "tenant_123",
  "action": "tenant.status.updated",
  "fromStatus": "active",
  "toStatus": "suspended",
  "actorId": "platform_admin_123",
  "createdAt": "2026-05-23T00:00:00.000Z"
}
```

Audit metadata must not include:

- Plaintext DB URL.
- DB username/password.
- API tokens.
- Automation tokens.
- Owner password.
- Webhook secrets.

## UI Guidance

Platform UI should show:

- Tenant status badge.
- Last provisioning error as a sanitized code/message.
- Last migration timestamp.
- Allowed actions for current status.

Tenant UI should show only a safe unavailable state when the tenant is not active.

Hinglish: Platform admin ko status aur action dikhna chahiye. Tenant admin ko sirf safe unavailable page dikhna chahiye, secrets kabhi nahi.
