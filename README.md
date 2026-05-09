# Apiagex

Apiagex is being rebuilt as a fresh MVP headless CMS/API platform.

Apiagex ko fresh MVP headless CMS/API platform ke roop me dobara banaya ja raha hai.

## Current Status

- Old implementation code is backed up in Git:
  - Branch: `backup/pre-mvp-rebuild`
  - Tag: `backup-pre-mvp-rebuild`
- Workspace/package setup is preserved.
- Package implementation folders are intentionally empty until the new MVP flow is confirmed.
- Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), [tasks.md](./tasks.md), and [task2.md](./task2.md) before coding.
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
- Task3 relation support now covers `oneToOne`, `oneToMany`, `manyToOne`, `manyToMany`, JSON storage, populate, delete guards, and Admin UI entry pickers.
- Task3 relation support ab `oneToOne`, `oneToMany`, `manyToOne`, `manyToMany`, JSON storage, populate, delete guards, aur Admin UI entry pickers cover karta hai.
- Dynamic APIs support one-level relation populate with `?populate=relations`, `?populate=all`, and `?populate=*`.
- Dynamic APIs `?populate=relations`, `?populate=all`, aur `?populate=*` ke saath one-level relation populate support karte hain.
- Schema builder checkpoint is ready at version `v0.3.5`.
- Schema builder checkpoint version `v0.3.5` par ready hai.
- Entry repository validates data against schema fields, required fields, types, and relation entry targets.
- Entry repository data ko schema fields, required fields, types, aur relation entry targets ke against validate karta hai.
- Entry admin APIs are available under `/api/admin/schemas/:schemaId/entries`.
- Entry admin APIs `/api/admin/schemas/:schemaId/entries` ke under available hain.
- React Admin UI now generates entry forms from schema fields, including single relation selects and multi relation pickers.
- React Admin UI ab schema fields se entry forms generate karta hai, including single relation selects aur multi relation pickers.
- Dynamic content APIs are available at `/api/content/:schemaSlug`.
- Dynamic content APIs `/api/content/:schemaSlug` par available hain.
- Admin UI lists generated dynamic APIs for each schema.
- Admin UI har schema ke generated dynamic APIs list karta hai.
- Dynamic API checkpoint is ready at version `v0.4.6`.
- Dynamic API checkpoint version `v0.4.6` par ready hai.
- Role admin APIs are available at `/api/admin/roles`.
- Role admin APIs `/api/admin/roles` par available hain.
- `/api/admin/roles` lists API roles only; owner/admin control-plane roles are hidden from content API permissions.
- `/api/admin/roles` sirf API roles list karta hai; owner/admin control-plane roles content API permissions se hidden hain.
- Permission model supports getAll, get, create, update, delete, and manage per API role and schema.
- Permission model API role aur schema ke hisab se getAll, get, create, update, delete, aur manage support karta hai.
- Admin UI role permissions screen shows dynamic API action checkboxes for API roles.
- Admin UI role permissions screen API roles ke liye dynamic API action checkboxes dikhata hai.
- Dynamic APIs enforce role permissions when `x-apiagex-role-id` is provided.
- Dynamic APIs `x-apiagex-role-id` provide hone par role permissions enforce karte hain.
- User admin APIs are available at `/api/admin/users` with one API role per user.
- User admin APIs `/api/admin/users` par available hain, har user ke liye ek API role.
- Admin UI Users screen can create and list users with API role assignment.
- Admin UI Users screen API role assignment ke saath users create aur list kar sakta hai.
- Admin UI Settings has an attached submenu with Admin Roles and Content Roles options.
- Admin UI Settings me attached submenu hai jisme Admin Roles aur Content Roles options hain.
- Admin panel permissions are stored separately for schemas, entries, API roles, API users, and settings.
- Admin panel permissions schemas, entries, API roles, API users, aur settings ke liye alag store hote hain.
- RBAC end-to-end flow verifies user login plus allowed and blocked dynamic API access.
- RBAC end-to-end flow user login aur allowed/blocked dynamic API access verify karta hai.
- MVP RBAC checkpoint is ready at version `v0.5.8`.
- MVP RBAC checkpoint version `v0.5.8` par ready hai.
- Admin UI has cleaner layout, form controls, empty states, and responsive styling.
- Admin UI me cleaner layout, form controls, empty states, aur responsive styling hai.
- Task4 Admin UI redesign work now includes a custom app shell, light/dark theme toggle, responsive list polish, accessible keyboard navigation, confirm dialogs, and consistent status toasts.
- Task4 Admin UI redesign work me custom app shell, light/dark theme toggle, responsive list polish, accessible keyboard navigation, confirm dialogs, aur consistent status toasts include hain.
- Admin UI visual QA expectations are documented at [docs/admin-ui-visual-qa.md](./docs/admin-ui-visual-qa.md).
- Admin UI visual QA expectations [docs/admin-ui-visual-qa.md](./docs/admin-ui-visual-qa.md) me documented hain.
- MVP manual QA checklist is available at [docs/qa-checklist.md](./docs/qa-checklist.md).
- MVP manual QA checklist [docs/qa-checklist.md](./docs/qa-checklist.md) me available hai.
- `npm run smoke` covers the full MVP owner/schema/entry/dynamic API/RBAC flow.
- `npm run smoke` full MVP owner/schema/entry/dynamic API/RBAC flow cover karta hai.
- Apiagex MVP release gate is ready at version `v1.0.0`.
- Apiagex MVP release gate version `v1.0.0` par ready hai.
- Apiagex task2 release gate is ready at version `v2.0.0`.
- Apiagex task2 release gate version `v2.0.0` par ready hai.

## MVP Direction

The rebuilt product should let an owner:

- log in,
- create a schema/API from Admin UI,
- add fields,
- create entries,
- get generated API endpoints under `/api`,
- read generated docs,
- allow/block APIs per API role.

Primary MVP paths: `/doc`, `/readme`, `/adminui`, and `/api`.

Admin redesign note: `/adminui` remains the React Admin UI served by the API server, while `/doc` and `/readme` remain public static docs routes from the docs package. The redesign changes the visible Admin UI, not these server paths.

Admin redesign note Hinglish: `/adminui` API server se served React Admin UI hi rahta hai, aur `/doc` plus `/readme` docs package ke public static docs routes hi rahte hain. Redesign visible Admin UI change karta hai, server paths nahi.

## Schema Builder Quick Use

English: Log in at `/adminui`, create the target schema first, then create schemas with text, long text, number, boolean, date, JSON, media, or relation fields. Relation fields must select an existing schema target.

Hinglish: `/adminui` par login karo, pehle target schema banao, phir text, long text, number, boolean, date, JSON, media, ya relation fields ke saath schema banao. Relation field me existing schema target select karna zaruri hai.

## Dynamic API Quick Use

English: After creating a schema, use `/api/content/:schemaSlug` for list/create and `/api/content/:schemaSlug/:entryId` for read/update/delete. Send entry payloads as `{ "data": { ... } }`.

Hinglish: Schema banane ke baad list/create ke liye `/api/content/:schemaSlug` use karo aur read/update/delete ke liye `/api/content/:schemaSlug/:entryId` use karo. Entry payload `{ "data": { ... } }` shape me bhejo.

## Relation Semantics

English: Task3 relation behavior is implemented for schema metadata, entry validation, JSON storage, dynamic APIs, one-level populate, delete safety, and Admin UI entry editing. `oneToOne` connects one entry to one target entry, like User Profile to User. `manyToOne` lets many entries point to one parent, like Articles to Category. `oneToMany` lets one parent hold many child entry ids, like Author to Articles. `manyToMany` lets both sides connect to many entries, like Articles and Tags.

Hinglish: Task3 relation behavior schema metadata, entry validation, JSON storage, dynamic APIs, one-level populate, delete safety, aur Admin UI entry editing ke liye implemented hai. `oneToOne` one entry ko one target entry se connect karta hai, jaise User Profile to User. `manyToOne` many entries ko one parent par point karne deta hai, jaise Articles to Category. `oneToMany` one parent me many child entry ids rakhta hai, jaise Author to Articles. `manyToMany` dono sides ko many entries se connect karne deta hai, jaise Articles aur Tags.

English: Single relations store one entry id string or `null`; multi relations store arrays of entry ids. Dynamic reads/lists can expand one relation level with `?populate=relations`, `?populate=all`, or `?populate=*`. Admin UI verifies relation builder, entry pickers, required relation validation, relation summaries, desktop/mobile roundtrips, and all four relation types before release work.

Hinglish: Single relations ek entry id string ya `null` store karte hain; multi relations entry ids ka array store karte hain. Dynamic reads/lists `?populate=relations`, `?populate=all`, ya `?populate=*` se one relation level expand kar sakte hain. Admin UI release work se pehle relation builder, entry pickers, required relation validation, relation summaries, desktop/mobile roundtrips, aur all four relation types verify karta hai.

## RBAC Quick Use

English: Create or select an API role, assign schema action permissions, create a user with that API role, login with `/api/auth/login-user`, then call dynamic APIs with `x-apiagex-role-id`. Allowed API roles work; blocked roles receive `API_PERMISSION_DENIED`. Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`; API roles include `reader`, `single-reader`, `writer`, `editor`, and `public`. `manage` allows all content API actions for one schema, but only for API roles.

Hinglish: API role banao ya select karo, schema action permissions assign karo, us API role ke saath user banao, `/api/auth/login-user` se login karo, phir dynamic APIs ko `x-apiagex-role-id` ke saath call karo. Allowed API roles work karte hain; blocked roles ko `API_PERMISSION_DENIED` milta hai. Admin roles `owner`, `admin`, `schema-manager`, `user-manager` hain; API roles me `reader`, `single-reader`, `writer`, `editor`, aur `public` hain. `manage` one schema ke sab content API actions allow karta hai, lekin sirf API roles ke liye.

## Settings Access Control

English: Open `/adminui#settings` after owner login. The left menu compacts and an attached Settings submenu shows Admin Roles and Content Roles. Admin permissions cover schemas, entries, API roles, API users, and settings. These permissions are stored outside generated content API permissions, so admin roles still cannot access `/api/content` by role id.

Hinglish: Owner login ke baad `/adminui#settings` open karo. Left menu compact hota hai aur attached Settings submenu me Admin Roles aur Content Roles dikhte hain. Admin permissions schemas, entries, API roles, API users, aur settings cover karte hain. Ye generated content API permissions se alag store hote hain, isliye admin roles role id se `/api/content` access nahi kar sakte.

## Local Persistence

English: `npm run dev` stores local server data in `.apiagex/apiagex.sqlite` and reserves `.apiagex/uploads` for local uploads. Override with `APIAGEX_DATABASE_PATH` and `APIAGEX_UPLOADS_PATH` when you need a different local path.

Hinglish: `npm run dev` local server data `.apiagex/apiagex.sqlite` me store karta hai aur local uploads ke liye `.apiagex/uploads` use karta hai. Alag local path chahiye ho to `APIAGEX_DATABASE_PATH` aur `APIAGEX_UPLOADS_PATH` set karo.

Tests stay isolated by passing in-memory databases directly; they do not write to `.apiagex` by default.

Task2 release verification covered routed Admin UI desktop/mobile browser checks, static `/doc` and `/readme`, local persistence, create-apiagex CLI, smoke tests, audit, and live API/RBAC allow/block flow.

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
