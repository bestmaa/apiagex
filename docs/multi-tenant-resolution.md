# Multi Tenant Resolution Rules

Tenant resolution maps an HTTP request to one tenant context. Multi-tenant Apiagex should resolve exactly one tenant before any tenant admin, content, media, workflow, realtime, webhook, AI, or MCP route runs.

Hinglish: Request aayi to sabse pehle ye decide hoga ki ye kis restaurant/tenant ki request hai. Uske baad hi us tenant ka DB/uploads use hoga.

## Resolution Order

Apiagex should resolve tenants in this order:

1. Exact custom domain match.
2. Subdomain match under the configured root domain.
3. Local/dev path prefix match.

First match wins.

## Custom Domain

Example:

```text
Host: admin.pizzahouse.com
GET /api/content/menu
```

Resolution:

```text
tenant_domains.hostname = admin.pizzahouse.com
```

Rules:

- Normalize host to lowercase.
- Strip port before lookup.
- Reject invalid hostnames.
- Prefer verified domains for production traffic.
- If multiple rows somehow match, fail closed with `TENANT_DOMAIN_CONFLICT`.

Custom domains are best for paid SaaS tenants.

## Subdomain

Example:

```text
Root domain: yourapp.com
Host: pizza-house.yourapp.com
GET /adminui
```

Resolution:

```text
subdomain = pizza-house
```

Rules:

- Root domain comes from config, such as `APIAGEX_TENANT_ROOT_DOMAIN=yourapp.com`.
- Subdomain must be one DNS label.
- Subdomain should map to `tenants.subdomain`.
- If `tenants.subdomain` is empty, fallback to `tenants.slug` can be allowed by config.
- Reserved subdomains must not resolve to tenants.

Reserved examples:

```text
www
api
admin
platform
status
static
assets
docs
```

## Path Prefix

Path-prefix tenancy is for local/dev and tests.

Example:

```text
GET /t/pizza-house/adminui
GET /t/pizza-house/api/content/menu
```

Resolution:

```text
tenant slug = pizza-house
rewritten path = /adminui
rewritten path = /api/content/menu
```

Rules:

- Enabled only when config allows it.
- Default prefix should be `/t`.
- Tenant slug comes from the next path segment.
- Slug must pass normal Apiagex slug validation.
- The resolved route should receive the rewritten path.
- Generated URLs should preserve the tenant prefix in local/dev mode.

Path-prefix mode is useful for automated tests because it avoids DNS setup.

## Localhost Behavior

Localhost should stay simple.

Recommended behavior:

```text
APIAGEX_MULTI_TENANT_MODE=false
http://127.0.0.1:4000/adminui -> single-tenant current behavior
```

When multi-tenant mode is enabled locally:

```text
http://127.0.0.1:4000/t/pizza-house/adminui
http://localhost:4000/t/pizza-house/api/content/menu
```

Localhost without a tenant prefix should return a platform page or tenant-not-found response, depending on platform UI availability.

## Host Header Safety

Never trust raw `Host` blindly.

Resolver must:

- Strip port safely.
- Lowercase hostnames.
- Reject empty host.
- Reject whitespace.
- Reject path separators.
- Reject hostnames longer than 253 characters.
- Reject DNS labels longer than 63 characters.
- Reject wildcard-like values from user input.
- Use configured trusted proxy behavior before honoring forwarded host headers.

Allowed characters for DNS labels:

```text
a-z
0-9
-
.
```

No label should start or end with `-`.

## Forwarded Host

If Apiagex runs behind a proxy, the resolver may need `x-forwarded-host`.

Rules:

- Use forwarded host only when `APIAGEX_TRUST_PROXY=true`.
- Prefer the first forwarded host value.
- Apply the same hostname validation.
- Do not use forwarded host by default.

## Resolution Output

The resolver should return:

```ts
type TenantResolution =
  | {
      ok: true;
      mode: "customDomain" | "subdomain" | "pathPrefix";
      originalHost: string;
      originalPath: string;
      rewrittenPath: string;
      tenantId: string;
      tenantSlug: string;
    }
  | {
      ok: false;
      error:
        | "TENANT_NOT_FOUND"
        | "TENANT_HOST_INVALID"
        | "TENANT_DOMAIN_CONFLICT"
        | "TENANT_RESERVED_SUBDOMAIN"
        | "TENANT_PATH_PREFIX_INVALID";
      statusCode: number;
    };
```

The actual implementation can use exported TypeScript types in a later task.

## Error Mapping

| Error | HTTP Status | Notes |
| --- | --- | --- |
| `TENANT_NOT_FOUND` | 404 | No tenant matched. |
| `TENANT_HOST_INVALID` | 400 | Host header is unsafe or malformed. |
| `TENANT_DOMAIN_CONFLICT` | 500 | Registry data is inconsistent. |
| `TENANT_RESERVED_SUBDOMAIN` | 404 | Reserved subdomain should not resolve to tenant. |
| `TENANT_PATH_PREFIX_INVALID` | 400 | Path-prefix slug is invalid. |

Status lifecycle errors such as `TENANT_SUSPENDED` are handled after successful resolution.

## Configuration

Planned config keys:

```text
APIAGEX_MULTI_TENANT_MODE=true
APIAGEX_TENANT_RESOLUTION=domain,subdomain,path
APIAGEX_TENANT_ROOT_DOMAIN=yourapp.com
APIAGEX_TENANT_PATH_PREFIX=/t
APIAGEX_TENANT_ALLOW_SLUG_SUBDOMAIN=true
APIAGEX_TENANT_RESERVED_SUBDOMAINS=www,api,admin,platform,status,static,assets,docs
APIAGEX_TRUST_PROXY=false
```

## Examples

### Custom Domain

```text
Host: menu.pizzahouse.com
Path: /api/content/item
Resolved tenant: pizza-house
Rewritten path: /api/content/item
```

### Subdomain

```text
Host: burger-point.yourapp.com
Path: /adminui
Resolved tenant: burger-point
Rewritten path: /adminui
```

### Path Prefix

```text
Host: 127.0.0.1:4000
Path: /t/cafe-blue/api/content/menu
Resolved tenant: cafe-blue
Rewritten path: /api/content/menu
```

## Tests Required Later

Resolver tests should cover:

- Custom domain match.
- Subdomain match.
- Path-prefix match.
- Port stripping.
- Lowercase normalization.
- Invalid host rejection.
- Reserved subdomain rejection.
- Unknown tenant.
- Forwarded host ignored by default.
- Forwarded host honored only with trusted proxy config.
- Path rewrite correctness.
- Root-domain mismatch.
- Tenant status checks after resolution.

## Summary

Production should use custom domains or subdomains. Local/dev should use path-prefix resolution. All modes must produce the same tenant context shape so the rest of Apiagex can stay tenant-aware without route-specific tenant logic.
