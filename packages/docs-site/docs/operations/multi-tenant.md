# Multi Tenant Preview

Multi-tenant mode is for SaaS products where each customer gets isolated Apiagex data.

::: warning Preview
Multi-tenant support is preview/beta. Read the release checklist before production use.
:::

## Target Model

- One platform/control database stores tenant registry.
- Every tenant gets a separate Apiagex database.
- Every tenant gets separate owner/admin state.
- Tenant requests resolve by subdomain, custom domain, or path prefix.
- Tenant uploads stay isolated.
- Tenant automation tokens stay inside the tenant.

Example:

```text
pizza.example.com/adminui
pizza.example.com/api/content/menu-item

burger.example.com/adminui
burger.example.com/api/content/menu-item
```

Hinglish: Har restaurant/customer ka apna DB, admin, schema, uploads, tokens aur data hoga. Ek tenant ka data dusre tenant me mix nahi hona chahiye.
