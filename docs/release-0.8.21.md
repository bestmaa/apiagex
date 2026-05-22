# Apiagex 0.8.21

Patch release for moving Apiagex project structure between database providers from the Admin UI.

## What changed

- Added `Settings -> Project Template` in the Admin UI.
- Added Admin API export/import endpoints for project templates.
- Export includes structure only: schemas, fields, roles, permissions, workflows, custom API routes/permissions, realtime settings, webhooks, and app settings.
- Export intentionally skips content entries, users, API tokens, automation tokens, realtime events, webhook events, and workflow run history.
- Import can be used on a fresh SQLite, MySQL, or PostgreSQL setup to recreate the project structure.
- Webhook secrets are regenerated during import instead of exported.
- Generated projects now depend on `@apiagex/server` `^0.8.21`.

## Verification

- Added route tests for template export/import.
- Updated Admin UI route coverage.
- Verified targeted Admin UI/server builds and tests before release.

## Publish

- Git tag: `npm-v0.8.21`
- npm packages: `@apiagex/database`, `@apiagex/server`, `create-apiagex`
