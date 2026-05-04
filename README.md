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
- Schema builder checkpoint is ready at version `v0.3.5`.
- Schema builder checkpoint version `v0.3.5` par ready hai.
- Entry repository validates data against schema fields, required fields, types, and relation entry targets.
- Entry repository data ko schema fields, required fields, types, aur relation entry targets ke against validate karta hai.
- Entry admin APIs are available under `/api/admin/schemas/:schemaId/entries`.
- Entry admin APIs `/api/admin/schemas/:schemaId/entries` ke under available hain.
- React Admin UI now generates entry forms from schema fields.
- React Admin UI ab schema fields se entry forms generate karta hai.
- Dynamic content APIs are available at `/api/content/:schemaSlug`.
- Dynamic content APIs `/api/content/:schemaSlug` par available hain.
- Admin UI lists generated dynamic APIs for each schema.
- Admin UI har schema ke generated dynamic APIs list karta hai.
- Dynamic API checkpoint is ready at version `v0.4.6`.
- Dynamic API checkpoint version `v0.4.6` par ready hai.
- Role admin APIs are available at `/api/admin/roles`.
- Role admin APIs `/api/admin/roles` par available hain.
- Permission model supports read, create, update, delete, and manage per role and schema.
- Permission model role aur schema ke hisab se read, create, update, delete, aur manage support karta hai.
- Admin UI role permissions screen shows dynamic API action checkboxes.
- Admin UI role permissions screen dynamic API action checkboxes dikhata hai.
- Dynamic APIs enforce role permissions when `x-apiagex-role-id` is provided.
- Dynamic APIs `x-apiagex-role-id` provide hone par role permissions enforce karte hain.

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

## Schema Builder Quick Use

English: Log in at `/adminui`, create the target schema first, then create schemas with text, long text, number, boolean, date, JSON, media, or relation fields. Relation fields must select an existing schema target.

Hinglish: `/adminui` par login karo, pehle target schema banao, phir text, long text, number, boolean, date, JSON, media, ya relation fields ke saath schema banao. Relation field me existing schema target select karna zaruri hai.

## Dynamic API Quick Use

English: After creating a schema, use `/api/content/:schemaSlug` for list/create and `/api/content/:schemaSlug/:entryId` for read/update/delete. Send entry payloads as `{ "data": { ... } }`.

Hinglish: Schema banane ke baad list/create ke liye `/api/content/:schemaSlug` use karo aur read/update/delete ke liye `/api/content/:schemaSlug/:entryId` use karo. Entry payload `{ "data": { ... } }` shape me bhejo.

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
