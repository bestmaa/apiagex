# Apiagex

Apiagex is being rebuilt as a fresh MVP headless CMS/API platform.

Apiagex ko fresh MVP headless CMS/API platform ke roop me dobara banaya ja raha hai.

## Current Status

- Old implementation code is backed up in Git:
  - Branch: `backup/pre-mvp-rebuild`
  - Tag: `backup-pre-mvp-rebuild`
- Workspace/package setup is preserved.
- Package implementation folders are intentionally empty until the new MVP flow is confirmed.
- Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) and [tasks.md](./tasks.md) before coding.
- Minimal routes now exist for `/api`, `/api/health`, `/doc`, `/readme`, and `/adminui`.
- `/doc` and `/readme` now explain the current MVP status in English and Hinglish.
- `/adminui` now has the first MVP navigation shell.
- Base path checkpoint is ready at version `v0.1.4`.
- SQLite MVP foundation defines the first database tables for auth, schema, entries, and permissions.
- First owner bootstrap API is `POST /api/auth/bootstrap-owner`.
- Admin UI owner login/logout is available at `/adminui`.
- Admin UI screens are built in React and served by the same API server.
- Owner docs are available on `/doc` and `/readme`.
- Owner bootstrap checkpoint is ready at version `v0.2.4`.
- Schema repository supports ordered fields and safe relation targets.
- Schema admin APIs are available at `/api/admin/schemas` for create, list, read, update, and delete.
- Schema admin APIs `/api/admin/schemas` par create, list, read, update, aur delete ke liye available hain.
- React Admin UI now includes a schema builder form with all MVP field types.
- React Admin UI me ab sab MVP field types ke saath schema builder form hai.
- Relation fields now use an existing-schema picker and backend validation.
- Relation fields ab existing-schema picker aur backend validation use karte hain.

## MVP Direction

The rebuilt product should let an owner:

- log in,
- create a schema/API from Admin UI,
- add fields,
- create entries,
- get generated API endpoints under `/api`,
- read generated docs,
- allow/block APIs per role.

Primary MVP paths: `/doc`, `/readme`, `/adminui`, and `/api`.

## Workspace

```txt
packages/create-apiagex  Installer CLI package
packages/core           Shared contracts package
packages/server         API server package
packages/database       Database adapter package
packages/admin          Admin UI package
docs                    Product and developer docs
```

## Verification Rule

When code returns, each completed task must be tested, checked in Browser Use when user-facing, documented in English/Hinglish, and committed.
