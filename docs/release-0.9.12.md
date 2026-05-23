# Apiagex 0.9.12

Multi-tenant preview release.

## Highlights

- Adds opt-in multi-tenant runtime wiring with request-scoped tenant database and uploads paths.
- Adds platform tenant routing, provisioning helpers, tenant owner bootstrap, health diagnostics, and migration guidance.
- Adds `create-apiagex --multi-tenant` starter config and docs.
- Adds tenant-safe AI/MCP automation flow so Codex can create schemas/workflows inside the resolved tenant.
- Adds tenant backup contract, SQLite tenant backup/restore helpers, and Postgres/MySQL backup guidance.
- Adds tenant template export/import guidance for schema/workflow/role setup without content data.
- Adds cross-tenant isolation coverage for admin APIs, content APIs, media, automation tokens, AI plans, templates, realtime config, and webhook config.
- Adds tenant-safe secret redaction, rate-limit hook labels, metrics labels, operational runbook, and release checklist.

## Safety Notes

- Multi-tenant mode is preview/beta. Keep production use behind the release checklist in `docs/multi-tenant-release-checklist.md`.
- Single-tenant mode remains the default starter behavior.
- Backup manifests intentionally exclude database URLs, encrypted DB URLs, passwords, API tokens, automation tokens, and app secrets.

## Verification

- `npm run build -w @apiagex/server`
- `npm run build -w create-apiagex`
- `npm run smoke`
- focused multi-tenant/create-apiagex/server test suites
