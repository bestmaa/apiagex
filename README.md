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
