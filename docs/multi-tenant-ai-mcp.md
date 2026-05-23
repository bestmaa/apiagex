# Multi Tenant AI And MCP Setup

Each tenant must use its own Apiagex base URL and its own automation token. Do not share one automation token across tenants.

## Tenant Environment

For a tenant at `pizza.example.com`:

```bash
APIAGEX_BASE_URL=https://pizza.example.com
APIAGEX_AUTOMATION_TOKEN=agx_auto_pizza_tenant_token
```

For a tenant at `burger.example.com`:

```bash
APIAGEX_BASE_URL=https://burger.example.com
APIAGEX_AUTOMATION_TOKEN=agx_auto_burger_tenant_token
```

The token must be created inside that tenant Admin UI or through a platform route that explicitly targets that tenant. A token created for `pizza.example.com` must fail on `burger.example.com`.

## Codex Context

Run the project context command from the application project:

```bash
npm run ai -- context
```

Keep real token values in environment variables or a local ignored `.env` file. Generated `.apiagex/codex.md` files should explain how to use Apiagex, but must not contain plaintext tokens.

## MCP Rule

MCP tools should call the tenant URL:

```text
https://<tenant-domain>/api/ai/*
```

They should not call platform tenant registry APIs unless the user is doing platform administration with a separate platform token.

## Isolation Guarantee

- Automation token verification happens against the resolved tenant database.
- AI schema/workflow/permission/plan operations run against the resolved tenant database.
- Platform tenant registry secrets are never included in MCP docs, AI summaries, or generated project context.
