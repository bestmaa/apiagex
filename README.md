# Apiagex

Apiagex is being rebuilt as a fresh MVP headless CMS/API platform.

Apiagex ko fresh MVP headless CMS/API platform ke roop me dobara banaya ja raha hai.

## Install

```bash
npm create apiagex@latest my-cms
# or
npx create-apiagex my-cms
```

Then:

```bash
cd my-cms
npm run dev
```

Open `http://127.0.0.1:4000/adminui`.

## Open Source License

Apiagex is released under the MIT License. You can use, modify, and distribute it, but the copyright and license notice must stay with copies or substantial portions of the software.

Apiagex MIT License ke under release hai. Aap use, modify, distribute kar sakte ho, lekin copyright aur license notice copies ya substantial portions ke saath rehna chahiye.

## Maintainer npm Publish

GitHub Actions has a manual workflow: `Publish npm packages`.

Required repository secret:

```txt
NPM_TOKEN
```

Run it from GitHub: Actions > Publish npm packages > Run workflow. Keep `dry_run=true` for checking; set `dry_run=false` to publish. Packages publish in this order: `@apiagex/database`, `@apiagex/server`, `create-apiagex`.

GitHub Actions me manual workflow hai: `Publish npm packages`.

GitHub repo secret me `NPM_TOKEN` add karo. Pehle `dry_run=true` se check karo; publish karna ho to `dry_run=false` karo. Publish order same rahega: `@apiagex/database`, `@apiagex/server`, `create-apiagex`.

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
- Admin Entries lists collections in an attached left submenu with table find/filter in the main content.
- Admin Entries collections ko attached left submenu me dikhata hai aur main content me table find/filter rakhta hai.
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
- Dynamic APIs enforce role permissions when `x-apiagex-role-id` or an API token is provided.
- Dynamic APIs `x-apiagex-role-id` ya API token provide hone par role permissions enforce karte hain.
- Content API tokens can be created for API roles and sent as `Authorization: Bearer TOKEN`.
- Content API tokens API roles ke liye create ho sakte hain aur `Authorization: Bearer TOKEN` ke roop me bheje ja sakte hain.
- User admin APIs are available at `/api/admin/users` with one API role per user.
- User admin APIs `/api/admin/users` par available hain, har user ke liye ek API role.
- Admin UI Users screen shows the user list first and opens create from a compact top button.
- Admin UI Users screen pehle user list dikhata hai aur top compact button se create open karta hai.
- Admin UI Settings has an attached submenu with Admin Roles and Content Roles options.
- Admin UI Settings me attached submenu hai jisme Admin Roles aur Content Roles options hain.
- Admin UI Settings also has Webhooks for signed content change notifications.
- Admin UI Settings me signed content change notifications ke liye Webhooks bhi hai.
- Admin UI Settings also has Realtime API for opt-in WebSocket events per generated content API.
- Admin UI Settings me har generated content API ke liye opt-in WebSocket Realtime API bhi hai.
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
- Current stabilization audit is documented at [docs/project-stabilization-audit.md](./docs/project-stabilization-audit.md).
- Current stabilization audit [docs/project-stabilization-audit.md](./docs/project-stabilization-audit.md) me documented hai.
- Strapi-style install and publish flow is documented at [docs/install-and-publish-flow.md](./docs/install-and-publish-flow.md).
- Strapi-style install aur publish flow [docs/install-and-publish-flow.md](./docs/install-and-publish-flow.md) me documented hai.
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

English: Create or select an API role, assign schema action permissions, then either create a user or create an API token for that role. Dynamic APIs accept `x-apiagex-role-id`, `Authorization: Bearer TOKEN`, or `x-apiagex-api-token`. Allowed API roles work; blocked roles receive `API_PERMISSION_DENIED`, and revoked tokens receive `API_TOKEN_INVALID`. Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`; API roles include `reader`, `single-reader`, `writer`, `editor`, and `public`.

Hinglish: API role banao ya select karo, schema action permissions assign karo, phir us role ke liye user ya API token banao. Dynamic APIs `x-apiagex-role-id`, `Authorization: Bearer TOKEN`, ya `x-apiagex-api-token` accept karte hain. Allowed API roles work karte hain; blocked roles ko `API_PERMISSION_DENIED` milta hai, aur revoked tokens ko `API_TOKEN_INVALID` milta hai. Admin roles `owner`, `admin`, `schema-manager`, `user-manager` hain; API roles me `reader`, `single-reader`, `writer`, `editor`, aur `public` hain.

## Settings Access Control

English: Open `/adminui#settings` after owner login. The left menu compacts and an attached Settings submenu shows Admin Roles, Content Roles, Webhooks, and Realtime API. Admin permissions cover schemas, entries, API roles, API users, and settings. These permissions are stored outside generated content API permissions, so admin roles still cannot access `/api/content` by role id.

Hinglish: Owner login ke baad `/adminui#settings` open karo. Left menu compact hota hai aur attached Settings submenu me Admin Roles, Content Roles, Webhooks, aur Realtime API dikhte hain. Admin permissions schemas, entries, API roles, API users, aur settings cover karte hain. Ye generated content API permissions se alag store hote hain, isliye admin roles role id se `/api/content` access nahi kar sakte.

## Webhook Quick Use

English: Open `/adminui#settings/webhooks`, create a hook with a target URL, choose entry events, and optionally choose one collection. Matching content create, update, and delete writes send signed JSON to the URL with `x-apiagex-event`, `x-apiagex-webhook-id`, `x-apiagex-delivery-id`, `x-apiagex-timestamp`, and `x-apiagex-signature`. The signature is `HMAC_SHA256(secret, timestamp + "." + deliveryId + "." + rawBody)`, and receivers should reject old timestamps plus already processed delivery ids. Failed hook calls are logged and retried without failing the content write.

Hinglish: `/adminui#settings/webhooks` open karo, target URL ke saath hook banao, entry events choose karo, aur optional collection choose karo. Matching content create, update, aur delete writes signed JSON ko URL par bhejte hain with `x-apiagex-event`, `x-apiagex-webhook-id`, `x-apiagex-delivery-id`, `x-apiagex-timestamp`, aur `x-apiagex-signature`. Signature `HMAC_SHA256(secret, timestamp + "." + deliveryId + "." + rawBody)` hota hai, aur receiver old timestamps plus already processed delivery ids reject kare. Failed hook calls log aur retry hote hain, content write fail nahi hota.

## Realtime API Quick Use

English: Open `/adminui#settings/realtime`, enable one collection, then let your trusted backend create a browser-safe session with `POST /api/realtime/session` using `Authorization: Bearer API_TOKEN` and body `{ "schema": "orders" }`. Return only the `rt_` session token to the browser, then connect clients to `ws://HOST/api/realtime?schema=orders&session=rt_...`. Session tokens are one-time use, default to 5 minutes, and are checked only while opening a socket; an already connected socket is not closed by session expiry. Events include `eventId`, `messageId`, `event`, `schema`, `entry`, and `occurredAt`; after rendering, clients should store `eventId` and send `{ "type": "ack", "messageId": "..." }`. On reconnect, create a fresh session and pass `lastEventId=EVENT_ID` to replay missed events, then refetch `/api/content/:schemaSlug` after ack timeout or long offline periods.

Hinglish: `/adminui#settings/realtime` open karo, collection enable karo, phir trusted backend browser-safe session ke liye `POST /api/realtime/session` call kare jisme `Authorization: Bearer API_TOKEN` aur body `{ "schema": "orders" }` ho. Browser ko sirf `rt_` session token return karo, phir client ko `ws://HOST/api/realtime?schema=orders&session=rt_...` par connect karo. Session token one-time use hota hai, default 5 minute valid hota hai, aur sirf socket open hote time check hota hai; jo socket already connected hai vo session expiry se close nahi hota. Event me `eventId`, `messageId`, `event`, `schema`, `entry`, aur `occurredAt` aata hai; render ke baad client `eventId` store kare aur `{ "type": "ack", "messageId": "..." }` bheje. Reconnect par fresh session create karo aur missed events replay ke liye `lastEventId=EVENT_ID` pass karo, phir ack timeout ya long offline period ke baad `/api/content/:schemaSlug` refetch karo.

English: Settings > Realtime API also shows recent realtime event history. Apiagex keeps the latest 1000 events per collection for reconnect replay and prunes older events automatically after new events are recorded.

Hinglish: Settings > Realtime API recent realtime event history bhi dikhata hai. Apiagex reconnect replay ke liye har collection ke latest 1000 events rakhta hai aur naye events record hone ke baad purane events automatically prune karta hai.

## Local Persistence

English: `npm run dev` stores local server data in `.apiagex/apiagex.sqlite` and reserves `.apiagex/uploads` for local uploads. Override with `APIAGEX_DATABASE_PATH` and `APIAGEX_UPLOADS_PATH` when you need a different local path.

Hinglish: `npm run dev` local server data `.apiagex/apiagex.sqlite` me store karta hai aur local uploads ke liye `.apiagex/uploads` use karta hai. Alag local path chahiye ho to `APIAGEX_DATABASE_PATH` aur `APIAGEX_UPLOADS_PATH` set karo.

Tests stay isolated by passing in-memory databases directly; they do not write to `.apiagex` by default.

Task2 release verification covered routed Admin UI desktop/mobile browser checks, static `/doc` and `/readme`, local persistence, create-apiagex CLI, smoke tests, audit, and live API/RBAC allow/block flow.

Task 10.0.14 stabilization audit adds a full feature audit test and practical user docs for owner auth, schemas, entries, content query filters, relations, RBAC, tokens, users, webhooks, realtime sessions, Admin UI, `/doc`, and `/readme`.

## Create A New Apiagex Project

English: Use `npm create apiagex@latest my-cms` or `npx create-apiagex my-cms`. The installer asks for setup mode, package manager, install preference, git preference, and owner setup preference. Generated projects depend on `@apiagex/server` and expose `npm run dev`, `npm run start`, `npm run smoke`, and `npm run build`.

Hinglish: `npm create apiagex@latest my-cms` ya `npx create-apiagex my-cms` use karo. Installer setup mode, package manager, install preference, git preference, aur owner setup preference puchta hai. Generated projects `@apiagex/server` par depend karte hain aur `npm run dev`, `npm run start`, `npm run smoke`, plus `npm run build` expose karte hain.

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
