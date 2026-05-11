# Apiagex Project Context

Apiagex is being rebuilt from a fresh MVP baseline.

Apiagex fresh MVP baseline se dobara ban raha hai.

## Current State

- Previous implementation backup branch: `backup/pre-mvp-rebuild`
- Previous implementation backup tag: `backup-pre-mvp-rebuild`
- Package/workspace setup is preserved.
- Old implementation code was removed.
- New code must follow `tasks.md` for completed MVP v0 history and `task2.md` for current work.
- Minimal API server shell exists with `/api`, `/api/health`, `/doc`, `/readme`, and `/adminui`.
- `/doc` and `/readme` now show English+Hinglish completed-feature summaries.
- `/adminui` now shows the minimal Admin shell navigation.
- Base path checkpoint v0.1.4 covers `/api`, `/api/health`, `/doc`, `/readme`, and `/adminui`.
- SQLite MVP foundation creates migrations, roles, users, schemas, fields, entries, and permissions tables.
- `POST /api/auth/bootstrap-owner` creates the first owner and blocks repeat bootstrap.
- `POST /api/auth/login` logs in the owner after bootstrap.
- `/adminui` is now a React Admin UI served by Fastify.
- React Admin UI includes owner login/logout controls backed by bootstrap/login APIs.
- `/doc` and `/readme` document owner bootstrap and login routes.
- Owner bootstrap/login checkpoint v0.2.4 is ready.
- Schema repository can create schemas, ordered fields, and relation fields that target existing schemas.
- Schema admin APIs can create, list, read, update, and delete schemas at `/api/admin/schemas`.
- Schema admin APIs `/api/admin/schemas` par schema create, list, read, update, aur delete kar sakte hain.
- React Admin UI includes a schema builder form after owner login.
- React Admin UI owner login ke baad schema builder form dikhata hai.
- Relation fields can pick an existing schema target and are validated by the backend.
- Relation fields existing schema target pick kar sakte hain aur backend validation hota hai.
- Task3 relation support covers `oneToOne`, `oneToMany`, `manyToOne`, `manyToMany`, JSON value storage, delete guards, schema metadata, and one-level populate.
- Task3 relation support `oneToOne`, `oneToMany`, `manyToOne`, `manyToMany`, JSON value storage, delete guards, schema metadata, aur one-level populate cover karta hai.
- `/doc` and `/readme` now document schema builder usage and relation rules.
- `/doc` aur `/readme` schema builder usage aur relation rules document karte hain.
- Schema builder checkpoint v0.3.5 is ready.
- Schema builder checkpoint v0.3.5 ready hai.
- Entry repository validates JSON entry data against schema fields and relation entry targets.
- Entry repository JSON entry data ko schema fields aur relation entry targets ke against validate karta hai.
- Entry admin APIs provide create, list, read, update, and delete under `/api/admin/schemas/:schemaId/entries`.
- Entry admin APIs `/api/admin/schemas/:schemaId/entries` ke under create, list, read, update, aur delete provide karte hain.
- React Admin UI generates entry forms from selected schema fields, including single relation selects and multi relation pickers.
- React Admin UI selected schema fields se entry forms generate karta hai, including single relation selects aur multi relation pickers.
- Dynamic content APIs expose each schema slug under `/api/content/:schemaSlug`.
- Dynamic content APIs har schema slug ko `/api/content/:schemaSlug` ke under expose karte hain.
- Dynamic content APIs can expand one relation level with `?populate=relations`, `?populate=all`, or `?populate=*`.
- Dynamic content APIs `?populate=relations`, `?populate=all`, ya `?populate=*` se one relation level expand kar sakte hain.
- Admin UI lists generated dynamic APIs for all schemas.
- Admin UI sab schemas ke generated dynamic APIs list karta hai.
- `/doc` and `/readme` include dynamic API usage examples.
- `/doc` aur `/readme` dynamic API usage examples include karte hain.
- Dynamic API checkpoint v0.4.6 is ready.
- Dynamic API checkpoint v0.4.6 ready hai.
- Role repository and `/api/admin/roles` APIs create, list, and read API roles only.
- Role repository aur `/api/admin/roles` APIs sirf API roles create, list, aur read karte hain.
- Bootstrap seeds admin roles `owner`, `admin`, `schema-manager`, `user-manager` and API roles `reader`, `single-reader`, `writer`, `editor`, `public`.
- Bootstrap admin roles `owner`, `admin`, `schema-manager`, `user-manager` aur API roles `reader`, `single-reader`, `writer`, `editor`, `public` seed karta hai.
- Permission model supports getAll, get, create, update, delete, and manage per API role and schema.
- Permission model API role aur schema ke hisab se getAll, get, create, update, delete, aur manage support karta hai.
- `getAll` controls dynamic list routes, `get` controls dynamic single-entry reads, and `manage` allows every action for that schema for API roles only.
- `getAll` dynamic list routes control karta hai, `get` dynamic single-entry reads control karta hai, aur `manage` sirf API roles ke liye us schema ke sab actions allow karta hai.
- Admin UI Settings > Content Roles can create API roles and save dynamic API action checkboxes.
- Admin UI Settings > Content Roles API roles create kar sakta hai aur dynamic API action checkboxes save kar sakta hai.
- Dynamic APIs enforce allow/block when `x-apiagex-role-id` or an API token is present.
- Dynamic APIs `x-apiagex-role-id` ya API token present hone par allow/block enforce karte hain.
- API role tokens are stored hashed in `api_tokens`; content APIs accept `Authorization: Bearer TOKEN` or `x-apiagex-api-token`.
- API role tokens `api_tokens` me hash hokar store hote hain; content APIs `Authorization: Bearer TOKEN` ya `x-apiagex-api-token` accept karte hain.
- Admin UI Settings > Content Roles can create, list, and revoke one-time visible API tokens for selected API roles.
- Admin UI Settings > Content Roles selected API roles ke liye one-time visible API tokens create, list, aur revoke kar sakta hai.
- Admin/control-plane roles are not accepted by content API permission checks or API-user assignment.
- Admin/control-plane roles content API permission checks ya API-user assignment me accept nahi hote.
- User repository and `/api/admin/users` APIs create content API users assigned to exactly one API role.
- User repository aur `/api/admin/users` APIs content API users ko exactly one API role ke saath create karte hain.
- Admin UI Users screen lists users with API role assignment.
- Admin UI Users screen API role assignment ke saath users list karta hai.
- Admin UI Users screen now shows the user list by default and opens the create form from a compact Create user button.
- Admin UI Users screen ab default me user list dikhata hai aur compact Create user button se create form open karta hai.
- Admin UI content sections now align to their content height so single-card screens do not stretch helper rows across the viewport.
- Admin UI content sections ab apni content height par align hote hain, isliye single-card screens helper rows ko viewport me stretch nahi karte.
- Admin UI screens outside Docs use English-only helper copy; `/doc` and `/readme` keep English plus Hinglish documentation.
- Docs ke bahar Admin UI screens English-only helper copy use karte hain; `/doc` aur `/readme` English plus Hinglish documentation preserve karte hain.
- Admin UI Settings now has an attached submenu with Admin Roles and Content Roles subroutes.
- Admin UI Settings me ab attached submenu hai jisme Admin Roles aur Content Roles subroutes hain.
- Settings submenu uses compact normal-height items with viewport-height desktop scrolling.
- Settings submenu compact normal-height items use karta hai aur desktop par viewport-height scrolling rakhta hai.
- Admin panel permissions are stored separately in `admin_permissions` for schemas, entries, API roles, API users, and settings.
- Admin panel permissions `admin_permissions` me schemas, entries, API roles, API users, aur settings ke liye alag store hote hain.
- RBAC end-to-end flow verifies user login plus allowed and blocked dynamic API access.
- RBAC end-to-end flow user login aur allowed/blocked dynamic API access verify karta hai.
- `/doc` and `/readme` document RBAC allow/block examples.
- `/doc` aur `/readme` RBAC allow/block examples document karte hain.
- MVP RBAC checkpoint v0.5.8 is ready.
- MVP RBAC checkpoint v0.5.8 ready hai.
- Admin UI has polished layout, form controls, empty states, and responsive styling.
- Admin UI me polished layout, form controls, empty states, aur responsive styling hai.
- Task4 Admin UI redesign work adds a custom shell, theme tokens, light/dark mode, responsive list polish, keyboard navigation, accessible confirm dialogs, and status toasts.
- Task4 Admin UI redesign work custom shell, theme tokens, light/dark mode, responsive list polish, keyboard navigation, accessible confirm dialogs, aur status toasts add karta hai.
- Admin UI visual QA checklist is documented in `docs/admin-ui-visual-qa.md`.
- Admin UI visual QA checklist `docs/admin-ui-visual-qa.md` me documented hai.
- Manual QA checklist is documented in `docs/qa-checklist.md`.
- Manual QA checklist `docs/qa-checklist.md` me documented hai.
- Project stabilization audit is documented in `docs/project-stabilization-audit.md` with practical flows, expected results, common errors, verified commands, and current gaps.
- Project stabilization audit `docs/project-stabilization-audit.md` me documented hai jisme practical flows, expected results, common errors, verified commands, aur current gaps hain.
- `npm run smoke` covers the full MVP owner/schema/entry/dynamic API/RBAC flow.
- `npm run smoke` full MVP owner/schema/entry/dynamic API/RBAC flow cover karta hai.
- Apiagex MVP release gate is ready at version `v1.0.0`.
- Apiagex MVP release gate version `v1.0.0` par ready hai.
- Admin Entries now uses an attached left Collections submenu, table view, find filter, visible field selection, last 50 default rows, and pagination.
- Admin Entries ab attached left Collections submenu, table view, find filter, visible field selection, last 50 default rows, aur pagination use karta hai.
- Admin Entries create form now opens from a compact Create entry button and closes after save or cancel.
- Admin Entries create form ab compact Create entry button se open hota hai aur save ya cancel ke baad close hota hai.
- Admin Entries shows an API query parameter guide for `fields`, `search`, `limit`, and `offset` on the selected collection.
- Admin Entries selected collection par `fields`, `search`, `limit`, aur `offset` ke liye API query parameter guide dikhata hai.
- Entry list APIs support `fields`, `search`, `limit`, and `offset` query parameters for admin and dynamic content lists.
- Entry list APIs admin aur dynamic content lists ke liye `fields`, `search`, `limit`, aur `offset` query parameters support karte hain.
- Dynamic single-entry reads support `fields` projection, such as `/api/content/article/ENTRY_ID?fields=title`.
- Dynamic single-entry reads `fields` projection support karte hain, jaise `/api/content/article/ENTRY_ID?fields=title`.
- Webhook registrations live at `/api/admin/webhooks` and can filter by entry created/updated/deleted events plus optional collection.
- Webhook registrations `/api/admin/webhooks` par hote hain aur entry created/updated/deleted events plus optional collection se filter ho sakte hain.
- Content admin and dynamic content create/update/delete writes enqueue webhook events, send signed HMAC requests, log delivery attempts, and keep content writes successful even when hook targets fail.
- Content admin aur dynamic content create/update/delete writes webhook events enqueue karte hain, signed HMAC requests bhejte hain, delivery attempts log karte hain, aur hook target fail hone par bhi content writes successful rakhte hain.

## Required MVP Paths

One server must serve exactly these primary paths:

- `/api` for backend APIs.
- `/adminui` for owner/admin/user UI.
- `/doc` for product/API docs in English+Hinglish.
- `/readme` for readable project summary in English+Hinglish.

## User-Defined MVP Flow

1. First-time owner bootstrap/login.
2. Owner opens Admin UI.
3. Owner creates a schema/API from a form.
4. Schema supports text, long text, number, boolean, date, JSON, media, and relation fields.
5. Relation design must be safe because generated APIs and UI depend on it.
6. Created schema becomes a dynamic API.
7. Admin UI lists all dynamic APIs.
8. Owner creates unlimited roles.
9. Owner assigns per-API permissions to each role with checkboxes.
10. Owner creates users and assigns roles.
11. User can see/access only APIs allowed by their role.
12. Allowed API request must succeed; blocked API request must fail.

## MVP Product Contract

### Routes

- `/api` is the only backend API prefix.
- `/api/health` proves the server is alive and returns `{ ok, service, path }`.
- `/doc` explains every completed feature with API examples.
- `/readme` gives a concise product/workspace summary.
- `/adminui` is the browser UI for owner/admin/user workflows.
- The current `/adminui` page includes Dashboard, Schemas, Entries, APIs, Users, Settings, and Docs navigation.
- Current Admin UI status: Dashboard, Schemas, Entries, APIs, Users, Settings, and Docs use the redesigned shell, light/dark theme, responsive list patterns, keyboard skip/focus handling, accessible delete confirmation, and status toast pattern.
- Current Admin UI status Hinglish: Dashboard, Schemas, Entries, APIs, Users, Settings, aur Docs redesigned shell, light/dark theme, responsive list patterns, keyboard skip/focus handling, accessible delete confirmation, aur status toast pattern use karte hain.

### Owner And Auth

- The first successful bootstrap login creates or activates the owner.
- Owner can manage the Admin UI and control-plane setup.
- Owner Admin UI aur control-plane setup manage kar sakta hai.
- Owner/admin panel roles are separate from content API permission roles.
- Owner/admin panel roles content API permission roles se alag hain.
- Owner can manage the split from Settings > Admin Roles and Settings > Content Roles.
- Owner Settings > Admin Roles aur Settings > Content Roles se is split ko manage kar sakta hai.
- Content API requests use API roles when `x-apiagex-role-id` or an API token is provided; owner/admin roles do not bypass content API checks.
- Content API requests `x-apiagex-role-id` ya API token aane par API roles use karte hain; owner/admin roles content API checks bypass nahi karte.
- Later content API users must be created by an allowed owner/admin flow.
- A content API user belongs to exactly one API role for MVP simplicity.

### Schema Builder

- A schema is an API definition with name, slug, description, and fields.
- Field types: text, long text, number, boolean, date, JSON, media, relation.
- Slugs must be unique and URL safe.
- Relation fields reference another schema by stable schema id/slug.
- Relations must validate target schema existence before save.
- Task3 relation contract defines four relation types: `oneToOne`, `oneToMany`, `manyToOne`, and `manyToMany`.
- Single relations use one entry id or `null`; multi relations use an array of entry ids.
- Relation fields carry target schema id, relation type, required flag, and value shape.
- Entry data relation value shapes are explicit: `oneToOne` and `manyToOne` use a single id or `null`; `oneToMany` and `manyToMany` use `string[]`.
- Comma-separated relation strings are not part of the Task3 contract.
- `oneToOne`: one source entry connects to one target entry, such as User Profile to User.
- `manyToOne`: many source entries can point to one parent entry, such as Articles to Category.
- `oneToMany`: one source entry can store many child entry ids, such as Author to Articles.
- `manyToMany`: both sides can connect to many entries, such as Articles and Tags.
- Current Task3 status: relation metadata, validation, JSON storage, populate, Admin UI schema builder, entry pickers, relation summaries, desktop/mobile roundtrips, and all four relation types are implemented and verified.
- Current Task3 status Hinglish: relation metadata, validation, JSON storage, populate, Admin UI schema builder, entry pickers, relation summaries, desktop/mobile roundtrips, aur all four relation types implemented aur verified hain.

### Relation Storage Model

- Canonical entry payloads remain in `entries.data_json` so existing entry read/write APIs keep one source of truth.
- Single relation values (`oneToOne`, `manyToOne`) are stored in `data_json` as one target entry id string or `null`.
- Multi relation values (`oneToMany`, `manyToMany`) are stored in `data_json` as arrays of target entry id strings.
- Many-to-many must not be represented as comma-separated strings, labels, or display-only text.
- A future relation index table can mirror relation values for integrity checks, delete guards, reverse lookup, and faster populate queries.
- Suggested future index shape: source schema id, source entry id, field slug, relation type, target schema id, target entry id, and position.
- The JSON payload remains the API contract; any index table is derived data and must be rebuilt safely if needed.

### Relation Migration Plan

- Existing relation fields that only have `relationSchemaId` should be treated as legacy single relations until a later strict migration assigns an explicit relation type.
- Existing entry relation values that are strings should remain valid for legacy single relations.
- New multi relation values must be arrays of entry ids; migration code must not convert comma-separated strings into relations automatically.
- If a relation index table is added, build it from `entries.data_json` inside a transaction and fail without deleting original JSON data.
- Rollback should be able to drop or ignore the derived index table while keeping `entries.data_json` unchanged.
- Before strict enforcement, run a validation report that lists wrong-schema ids, missing target entries, duplicate multi ids, and unsafe relation type changes.
- Destructive rewrites require an explicit future task and must not happen as part of planning.
- Conservative delete rule: referenced target entries are blocked from deletion so relation ids do not become dangling.
- Deleting the source entry is allowed because its relation JSON is deleted with it.
- Conservative schema delete rule: schemas referenced as relation targets by another schema are blocked from deletion.
- Relation field target/type updates are blocked when existing entries already use that relation field.

### Relation Storage Checkpoint

- Task3 relation storage gate verifies relation metadata validation, single and multi value shapes, many-to-one, one-to-one, one-to-many, many-to-many, normalization, readback, delete guards, schema delete guards, and update safety.
- Relation repository helpers centralize relation type defaults, entry JSON parsing, field-use checks, and reference checks for later API/populate work.
- Relation API gate verifies raw relation ids, `?populate=relations`, populate aliases, and RBAC allow/block behavior for related entries.
- Relation Admin UI gate verifies relation type/target builder controls, required relation validation, single/multi entry pickers, relation list summaries, desktop/mobile roundtrips, and all four relation types.
- Existing smoke flow must remain green before docs and release work continues.

### Dynamic APIs

- Every schema creates API routes under `/api/content/:schemaSlug`.
- MVP actions: list, read, create, update, delete.
- Admin UI must show every generated API with docs and examples.
- API behavior must match schema validation and relation rules.
- Dynamic list routes require `getAll` permission when `x-apiagex-role-id` or an API token is sent.
- Dynamic list routes `x-apiagex-role-id` ya API token bhejne par `getAll` permission require karte hain.
- Dynamic single-entry read routes require `get` permission when `x-apiagex-role-id` or an API token is sent.
- Dynamic single-entry read routes `x-apiagex-role-id` ya API token bhejne par `get` permission require karte hain.
- Dynamic list APIs support `fields`, `search`, `limit`, and `offset` for projected and paginated reads.
- Dynamic list APIs projected aur paginated reads ke liye `fields`, `search`, `limit`, aur `offset` support karte hain.
- Dynamic read APIs support `fields` for selecting one or more entry data fields.
- Dynamic read APIs one ya more entry data fields select karne ke liye `fields` support karte hain.
- Relation reads/lists support one-level populate with `?populate=relations`, `?populate=all`, and `?populate=*`.
- Populate must respect RBAC: related entries only expand when the request role has `get` on the target schema.

### RBAC

- Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`, plus custom admin roles from Settings.
- API roles are `reader`, `single-reader`, `writer`, `editor`, and `public`, plus any created API roles.
- Admin panel permissions are separate actions: schemas, entries, apiRoles, apiUsers, and settings.
- Owner can create unlimited API roles.
- Permissions are assigned per API role, per dynamic API, per action.
- Actions: getAll, get, create, update, delete, manage.
- `manage` is a schema-level API-role override that allows every content API action for that schema.
- Checked means allowed; unchecked means blocked by default.
- Permission verification must test an allowed user and blocked user.

### Webhooks

- Admins can manage webhooks from Settings > Webhooks.
- Webhook events are `entry.created`, `entry.updated`, and `entry.deleted`.
- Webhooks can apply to all collections or one selected schema.
- Deliveries send JSON with `event`, `schema`, `entry`, and `occurredAt`.
- Requests include `x-apiagex-event`, `x-apiagex-webhook-id`, `x-apiagex-delivery-id`, `x-apiagex-timestamp`, and `x-apiagex-signature`.
- The signature is `sha256=` plus an HMAC SHA-256 digest of `timestamp.deliveryId.rawBody` using the webhook secret.
- Receivers must reject old timestamps, store processed delivery ids, and verify the signature with a timing-safe compare.
- Failed delivery attempts are stored in `webhook_deliveries` with status code/error, attempt number, and next retry time.
- Webhook failures do not roll back the content create, update, or delete operation.

### Realtime API

- Admins can enable realtime WebSocket events per collection from Settings > Realtime API.
- Admins Settings > Realtime API se har collection ke liye WebSocket realtime events enable kar sakte hain.
- Production client subscriptions use a trusted backend to create a one-time session with `POST /api/realtime/session`, then the browser connects to `/api/realtime?schema=:schemaSlug&session=rt_...`.
- Production client subscriptions trusted backend se `POST /api/realtime/session` par one-time session create karte hain, phir browser `/api/realtime?schema=:schemaSlug&session=rt_...` par connect karta hai.
- Realtime sessions require a content API token with `getAll`, default to 5 minutes, can be used once, and do not close already connected sockets when the session expires.
- Realtime sessions ke liye `getAll` wala content API token chahiye, default 5 minute valid hote hain, one-time use hote hain, aur session expire hone par already connected sockets close nahi karte.
- Realtime events are `entry.created`, `entry.updated`, and `entry.deleted`, each with `eventId`, `messageId`, schema, entry, and `occurredAt`.
- Realtime events `entry.created`, `entry.updated`, aur `entry.deleted` hain, har event me `eventId`, `messageId`, schema, entry, aur `occurredAt` hota hai.
- Clients should store the latest `eventId`, ack processed messages, reconnect with `lastEventId`, and refetch current content after ack timeout or long offline periods.
- Clients latest `eventId` store karein, processed messages ko ack karein, `lastEventId` ke saath reconnect karein, aur ack timeout ya long offline period ke baad current content refetch karein.
- Settings > Realtime API shows recent event history and retention keeps the latest 1000 events per collection.
- Settings > Realtime API recent event history dikhata hai aur retention har collection ke latest 1000 events rakhta hai.
- Realtime delivery failures do not roll back the content create, update, or delete operation.
- Realtime delivery failure content create, update, ya delete operation ko rollback nahi karta.

## Static Docs Architecture

- `/doc` and `/readme` must remain public URLs.
- Authored documentation now lives in the `packages/docs` workspace package.
- The docs package uses a small static builder and preserves English + Hinglish content.
- Build output lands in `packages/docs/dist`.
- The API server serves built docs assets through stable `/doc` and `/readme` routes.
- `/doc` loads the main docs page, and `/readme` loads the readable project summary page.
- Missing docs build should return a clear fallback telling the developer to run the docs build.
- Admin UI redesign must preserve the same server paths: `/adminui` for the React app, `/doc` for product/API docs, and `/readme` for the readable summary.
- Admin UI redesign same server paths preserve karega: React app ke liye `/adminui`, product/API docs ke liye `/doc`, aur readable summary ke liye `/readme`.

## Local Persistence

- `npm run dev` resolves local SQLite data to `.apiagex/apiagex.sqlite` by default.
- `npm run dev` reserves `.apiagex/uploads` for local uploads by default.
- `APIAGEX_DATABASE_PATH` and `APIAGEX_UPLOADS_PATH` can override those paths.
- Tests pass in-memory databases directly and must not write to `.apiagex` by default.

## Verification Contract

- Browser Use is required for Admin UI, `/doc`, and `/readme` checks.
- API changes require automated tests and one manual request flow.
- RBAC changes require a real role+user+API allow/block verification.
- Relation changes require standard verification plus focused checks for payload shape, populate behavior, Admin UI relation pickers, and desktop/mobile entry editing.
- Every completed task must update docs where relevant and be committed.
- Task 10.0.14 adds `packages/server/tests/project-audit.test.ts` as a full feature audit covering routes, owner auth, schemas, entries, content filters, relations, RBAC, API tokens, users, webhooks, realtime session WebSocket flow, and docs/admin route availability.
- Task 10.0.14 `packages/server/tests/project-audit.test.ts` add karta hai jo routes, owner auth, schemas, entries, content filters, relations, RBAC, API tokens, users, webhooks, realtime session WebSocket flow, aur docs/admin route availability cover karta hai.

## Next Step

Task2 is complete through the `v2.0.0` release gate. Start the next task file when new scope is defined.

## Coding Rules

- Keep files below 250 lines.
- Use strict TypeScript.
- Put shared types in matching `*.type.ts` files.
- Keep one server for `/api`, `/adminui`, `/doc`, and `/readme`.
- Build real Admin UI screens in React, not inline server HTML.
