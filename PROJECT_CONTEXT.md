# Apiagex Project Context

This file is the handoff context for any model or developer continuing the project.

Ye file kisi bhi naye model ya developer ke liye handoff context hai jo project continue karega.

## Current Goal

Apiagex is an installable, open-source, multi-tenant headless CMS platform inspired by Strapi, but planned with a cleaner installer, dynamic API creation from UI, opt-in realtime per API, and strong documentation.

Apiagex ek installable, open-source, multi-tenant headless CMS platform hai. Ye Strapi se inspired hai, lekin cleaner installer, UI se dynamic API creation, har API ke liye opt-in realtime, aur strong documentation ke saath build hona hai.

## Important User Preferences

- User prefers Hindi/Hinglish conversation.
- Code must stay clean, modular, and easy to understand.
- Source files must stay under 250 lines.
- Types must be kept in separate matching `*.type.ts` files.
- Every package/module needs Hindi and English documentation.
- Tests must be written and run for behavior changes.
- Do not add large implementation without user asking for the next step.
- Build this project step by step.

## Architectural Decisions

- Backend runtime: Fastify is preferred for dynamic routes and plugin-style CMS behavior.
- Database query layer: Kysely is preferred over ORM because dynamic CMS tables and fields need SQL-level flexibility.
- First database targets: SQLite local file, PostgreSQL, and MySQL.
- MongoDB is not part of the first version.
- Installer-first approach: `create-apiagex` should be built before the full server/admin implementation.
- Documentation page is dependency-free static HTML/CSS/JS and is served by the API server at `/docs`.
- The docs shell now renders the markdown files in `docs/` directly, so markdown is the source of truth.
- Runtime should be single-server for local users: API, docs, README, uploads, and Admin UI are served by the API server.

## Current Workspace

```txt
agent.md                  Mandatory coding and documentation rules
PROJECT_CONTEXT.md        This handoff file
README.md                 Root project overview
docs/index.html           Static docs page with English/Hindi toggle
docs/styles.css           Docs page styles
docs/app.js               Docs language toggle logic
docs/*.md                 Markdown docs
packages/create-apiagex   Installer CLI package
packages/core             Future shared CMS contracts
packages/server           Fastify server package with docs route
packages/database         Future Kysely adapter package
packages/admin            Future admin UI package
```

## Implemented So Far

- npm workspace skeleton.
- `create-apiagex` package with initial installer question plan.
- Type files are separate from implementation files in `create-apiagex`.
- Tests for installer plan.
- `create-apiagex` now asks interactive prompts and writes a starter app scaffold.
- `create-apiagex` now generates a runnable starter app scaffold with `package.json`, `tsconfig.base.json`, `src/`, and `docs/`.
- `create-apiagex` now asks for a target folder and blocks accidental overwrite.
- `create-apiagex` now validates project names as safe lowercase slugs.
- `create-apiagex` now prints a post-install success screen with next commands and docs URL.
- `create-apiagex` now validates installer config values before writing files.
- `create-apiagex` now runs a smoke check on the generated starter scaffold.
- Generated starter now includes SQLite boot files for local development.
- Generated starter now includes a migration scaffold for bootstrap system tables.
- Generated starter now includes content-type storage helpers and metadata tables.
- `packages/server` now exposes starter admin content-type CRUD routes at `/admin/content-types`.
- `packages/server` now exposes starter content field CRUD routes at `/admin/content-types/:id/fields`.
- `packages/server` now exposes starter content entry CRUD routes at `/admin/content-types/:id/entries`.
- `packages/server` now validates entry payloads against saved field schemas before storing them.
- `packages/server` now supports relation fields with target content type metadata and validates relation targets on write.
- `packages/server` now exposes public read routes at `/api/:slug` and `/api/:slug/:entryId`.
- `packages/server` now supports `populate=relations`, `populate=media`, and `populate=all/*` on public read routes.
- `packages/server` now supports signed draft preview URLs through `/admin/content-types/:id/entries/:entryId/preview`.
- `packages/server` now supports `scheduled` entries with `publishAt` timestamps and a background sweep that publishes due entries automatically.
- `packages/server` now stores entry version snapshots and exposes version list/restore routes for rollback.
- `packages/server` now supports `pendingApproval` entries plus admin-only approve/reject transitions.
- `packages/server` now supports `?status=pendingApproval` on admin entry lists to surface the approval queue.
- `packages/server` now supports `q`, `page`, `pageSize`, and `sort` on admin entry lists for search, pagination, and newest/oldest ordering.
- `packages/server` now exposes `POST /auth/login` and protects admin routes with bearer tokens.
- `packages/server` now supports `admin`, `editor`, and `viewer` roles with route-level read/write permissions.
- `packages/server` now writes audit logs for content-type, field, and entry create/update/delete actions and exposes an admin-only `/admin/audit-logs` reader.
- `packages/server` now exposes webhook CRUD routes at `/admin/webhooks` and delivery history at `/admin/webhooks/:id/deliveries`.
- `packages/server` now emits audit-backed webhook events for content-type, field, entry, and media changes.
- `packages/server` now retries failed webhook deliveries with short backoff and stores attempt/status metadata.
- `packages/server` now supports opt-in realtime streams at `/realtime/stream` for realtime-enabled content types.
- `packages/server` now supports a realtime master flag plus per-action `create`, `update`, and `delete` realtime settings with legacy fallback for older content types.
- `packages/server` now includes end-to-end SSE tests for per-action realtime publishing and disabled realtime behavior.
- `packages/server` now evaluates role catalog permissions for dynamic content entry and authenticated public read/list access, with owner/admin bypass.
- `packages/server` now supports webhook content type and action filters while preserving empty-filter legacy behavior.
- `packages/server` now validates production startup config for required admin password and auth secret, optional account pairs, and valid ports.
- `packages/server` now supports backup export at `/admin/backups/export`, backup restore at `/admin/backups/restore`, and schema migration history at `/admin/migrations`.
- `packages/server` now creates hot-path SQLite indexes for entries, fields, media, audits, webhooks, and schema history.
- `packages/server` now keeps content-type and content-field schema data in memory with invalidation on create/update/delete.
- `packages/server` now keeps public published responses in a short TTL cache and clears them on content, media, and restore writes.
- `packages/server` now uses a local-disk media storage adapter by default, with `s3` and `minio` reserved as future driver placeholders.
- `packages/server` now adds `x-request-id` headers, structured request logs, and a detailed `/health/detail` route.
- `packages/admin` now includes an admin-only ops panel that reads `/api/health/detail` and shows service, cache, storage, and scheduler state.
- `packages/admin` stores the session role and hides admin-only actions for read-only or editor accounts.
- `create-apiagex` now writes `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` into the starter `.env.example`.
- The starter `.env.example` also reserves optional `EDITOR_EMAIL`, `EDITOR_PASSWORD`, `VIEWER_EMAIL`, and `VIEWER_PASSWORD` slots.
- `packages/admin` now serves a local admin UI scaffold for creating, editing, and deleting content types.
- `packages/admin` now starts with a login screen and stores a bearer token in localStorage after `/auth/login`.
- `packages/admin` now stores token expiry and auto-logs out when the session expires or the API returns `401`.
- `packages/admin` now syncs field rows through `/api/content-types/:id/fields`.
- `packages/admin` now has a field-driven entries panel that loads content type fields and saves entries through `/api/content-types/:id/entries`.
- `packages/admin` entry widgets now adapt to text, number, date, boolean, rich text, and repeatable fields.
- `packages/admin` relation fields now target other content types and store related entry IDs from the entry form.
- `packages/admin` now includes a media library panel that uploads files through `/api/media-files` and exposes uploaded ids to media fields.
- `packages/admin` now includes an admin-only audit log viewer backed by `/api/audit-logs`.
- `packages/admin` now includes an admin-only webhooks panel backed by `/api/webhooks` and delivery history routes.
- `packages/admin` now includes route visibility tests for schema, entries, realtime, roles, webhooks, and docs pages.
- `packages/admin` now includes a realtime toggle on the content-type form for live stream opt-in.
- `packages/admin` now subscribes to `/realtime/stream` and refreshes panels on matching live updates.
- `packages/admin` now documents the public API populate behavior for relation and media consumers.
- `packages/admin` now exposes a per-entry preview action that opens signed draft previews.
- `packages/admin` now supports scheduled publishing with a `Publish at` field on the entry form.
- `packages/admin` now includes a Versions panel that lists entry snapshots and restores older revisions.
- `packages/admin` now includes a compare mode in the Versions panel for field-by-field snapshot review.
- `packages/admin` now supports `pendingApproval` entries plus admin-only approve/reject actions.
- `packages/admin` now includes a pending-approval filter in the entries panel.
- `packages/admin` now includes search, page size, sort, and next/previous pagination controls in the entries panel.
- `packages/admin` now includes current-page bulk selection plus bulk approve, publish, unpublish, and delete actions in the entries panel.
- `packages/admin` now includes a global search panel that queries `/api/search` and opens matching content types, entries, or media files.
- `packages/admin` now includes backup and migrations panels for export/restore and schema history.
- `packages/admin` now includes an admin-only ops panel that reads `/api/health/detail` and shows service, cache, storage, and scheduler state.
- Root workspace now includes `npm run smoke` and `npm run release:check` for release hardening.
- Root docs now include a performance page with the index list and smoke commands.
- Root docs now include a workflow page for task sequencing, Git commits, Browser Use checks, and safe local data rules.
- The repository has been initialized as a local Git worktree on branch `main`.
- Root workspace now includes `npm run reset:local` for dry-run local SQLite/upload reset and `npm run reset:local -- --apply` for the guarded delete.
- `packages/server` now supports `APIAGEX_LOCAL_OWNER=true` in non-production mode to seed the local owner login `owner@apiagex.local` / `OwnerPass123!`.
- Docs now include a local reset page covering dry-run reset, guarded apply, local owner login, and recovery steps in English/Hinglish.
- Root workspace now includes `npm run reset:local:smoke`, which resets a temporary local DB/uploads fixture, recreates SQLite state, and verifies owner login.
- Docs now include the RBAC V2 permission scope grammar covering system, tenant, content, media, webhook, backup, realtime, audit, migration, and raw API scopes.
- `packages/server` now exports canonical RBAC V2 permission action constants for `read`, `create`, `update`, `delete`, `execute`, and `manage`.
- `packages/server` now includes a pure permission evaluator with owner bypass and default-deny exact scope/action checks.
- The permission evaluator now applies explicit deny precedence before any fallback allow.
- Existing content role catalog checks now run through the evaluator while preserving current list/read compatibility.
- Fastify routes can now attach and read RBAC scope/action metadata for later guard migration.
- Roles APIs now use `system:roles` permission checks with `read` for listing and `manage` for mutations.
- `packages/server` now serves the Admin UI at `/adminui/`, README at `/readme`, and admin UI API aliases under `/api/...` from the same server.
- `packages/server` now exposes a duplicate content-type route at `/admin/content-types/:id/duplicate`, and the admin content-type cards expose a Duplicate action.
- Static documentation page with top English/Hindi toggle.
- Static docs shell now renders `docs/*.md` directly with English/Hindi toggle.
- Docs now include dynamic API generation details, webhook filters, production hardening, and a repeatable manual verification checklist.
- Fastify server package serves the docs page at `/docs`.
- `@apiagex/database` now exposes placeholder adapter contracts and selector helpers.
- Basic docs for install flow, local SQLite database mode, and admin UI direction.

## Commands

```bash
npm run build
npm run dev
npm run test
npm run check
npm run smoke
npm run release:check
```

`npm run dev` starts the single API server. Use `/adminui/` for Admin UI, `/docs/` for docs, and `/readme` for README on the same host/port.
`npm run check` currently runs build and tests.
`npm run smoke` runs the install/restart/restore smoke test. `npm run release:check` runs the full release gate.

## Current Verification Status

Last verified:

```txt
npm run release:check -> pass
Browser Use docs check -> pass at http://localhost:4000/docs/
Browser Use admin UI check -> pass at http://localhost:4000/adminui/
npm audit            -> 0 vulnerabilities
```

## Next Recommended Step

Do not restart the project from scratch. The server, admin shell, dynamic content APIs, docs route, and RBAC foundation already exist. The next work should make the MVP obvious in Admin UI:

- Dashboard-first "Create API" flow: schema -> first entry -> generated API docs -> role assignment.
- Schema builder labels, validation, save feedback, and next-step CTA.
- Per-content-type docs with endpoint examples, auth notes, README/docs links, and copyable URLs.
- Per-API role allow/block UI for owner/admin/editor/viewer/custom roles.
- Browser Use verification on `/adminui/`, API manual request verification, automated tests, docs update, version bump, and commit after each task.

## Do Not Forget

- Keep each implementation file under 250 lines.
- If adding `something.routes.ts`, put types in `something.routes.type.ts`.
- If adding `something.service.ts`, put types in `something.service.type.ts`.
- Update docs after every module change.
- Run tests before reporting completion.
