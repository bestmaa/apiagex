# Apiagex Docs

Apiagex is an installable headless CMS and API runtime. You define schemas, create entries, assign API roles, issue tokens, and serve generated REST APIs from your project.

Hinglish: Apiagex ko project me install karke backend/API ready kar sakte ho. Admin UI se schema, entry, token, permission, realtime, webhook, aur custom API manage hota hai.

## What To Read First

1. [Create a Project](/getting-started/new-project) to install and start Apiagex.
2. [Owner Login And Shell](/admin-ui/) to open `/adminui` and understand the sidebar.
3. [Schema Builder](/schema-builder/) to create the collections that become APIs.
4. [Generated Content API](/apis/generated) to call those APIs from frontend apps.
5. [Tokens](/security/tokens) to connect clients, Codex, and automation safely.

## Main Local Routes

| Route | Purpose |
| --- | --- |
| `/adminui` | React Admin UI for owner and admin workflows. |
| `/doc` | Existing compact static docs route served by `@apiagex/server`. |
| `/readme` | Existing readable project summary route. |
| `/api/health` | Health check. |
| `/api/content/:schemaSlug` | Generated content REST API. |
| `/api/custom/...` | Custom or workflow-backed API routes. |
| `/api/openapi.json` | OpenAPI JSON when API docs are enabled. |
| `/api/swagger` | Swagger UI when API docs are enabled. |

::: warning Existing Docs Route
This VitePress site is a separate docs package. It does not replace `/doc` or `/readme` until a future server integration task explicitly does that.
:::
