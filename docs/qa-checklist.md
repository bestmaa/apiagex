# Apiagex MVP QA Checklist

## English

### Browser Use Checks

- Open `/readme` and confirm current status is visible.
- Open `/doc` and confirm API examples are visible.
- Open `/adminui` and login as owner.
- Create a schema with one text field.
- Open Entries and confirm collections appear in the attached left submenu.
- Create an entry from the generated entry form.
- Confirm Generated APIs shows `/api/content/:schemaSlug`.
- Open Settings and confirm the left menu compacts with Admin Roles, Content Roles, Webhooks, and Realtime API submenu options.
- Confirm Settings submenu items keep normal compact height and scroll inside the 100vh column if content grows.
- Create a custom admin role in Settings and save one admin permission.
- Open Settings > Content Roles, create an API role, and save at least one permission checkbox.
- Create an API token for the selected Content Role and confirm the token appears only after creation.
- Open Settings > Webhooks, open the verification docs link, create a webhook, trigger a matching entry write, and confirm a delivery log appears.
- Open Settings > Realtime API, enable one collection, open the client docs link, create a realtime session token, connect a WebSocket client with `session=rt_...`, trigger a matching entry write, confirm a realtime event plus ack, then reconnect with a fresh session plus `lastEventId` and confirm missed event replay.
- Confirm Settings > Realtime API shows recent realtime event history and the retention count.
- Open Users, confirm the list is visible first, then click Create user and create a user assigned to that API role.
- Confirm Users and other non-doc Admin UI screens keep normal content height and do not show `English:` or `Hinglish:` helper labels.
- Confirm there are no current-page console errors.
- Check desktop and narrow mobile-sized layouts for readable text and non-overlapping controls.

### Relation Modeling Checks

- In `/adminui`, create a target schema first, then create source schemas or fields for `oneToOne`, `oneToMany`, `manyToOne`, and `manyToMany`.
- Expected: every relation field saves with the chosen relation type and target schema visible in schema details.
- Create entries with a single relation picker and a multi relation picker.
- Expected: single relation values save one entry id; multi relation values save arrays and show selected entry labels/counts in the entry list.
- Edit a relation entry, save it, reload `/adminui`, and select the same schema again.
- Expected: edited single and multi relation values remain selected and visible after reload.
- Check `/adminui` on a narrow mobile viewport.
- Expected: relation type picker, target picker, entry picker, and relation summaries remain readable and do not overlap.
- Open `/doc` and `/readme`.
- Expected: relation types, payload examples, populate options, Admin UI flow, and common errors are documented.

### API Request Checks

- `GET /api/health` returns `{ "ok": true }`.
- `POST /api/auth/bootstrap-owner` creates the first owner on a fresh database.
- `POST /api/auth/login` logs in the owner.
- `POST /api/admin/schemas` creates a schema.
- `POST /api/admin/schemas/:schemaId/entries` creates an entry.
- `POST /api/content/:schemaSlug` creates dynamic content.
- `GET /api/admin/roles` lists API roles only and excludes `owner`, `admin`, `schema-manager`, and `user-manager`.
- `GET /api/admin/settings/access` lists admin roles and API roles separately.
- `PUT /api/admin/settings/access/admin-roles/:roleId/permissions` saves admin permissions outside content API permissions.
- `POST /api/admin/roles` creates an API role.
- `PUT /api/admin/roles/:roleId/permissions` saves permissions.
- `POST /api/admin/roles/:roleId/tokens` creates a one-time visible token.
- `GET /api/content/:schemaSlug` works with `Authorization: Bearer TOKEN` when that token role has `getAll`.
- `DELETE /api/admin/roles/:roleId/tokens/:tokenId` revokes the token and the same content request returns `403 API_TOKEN_INVALID`.
- `POST /api/admin/webhooks` creates a webhook for `entry.created`, `entry.updated`, or `entry.deleted`.
- `PUT /api/admin/realtime/:schemaId` enables realtime for selected `entry.created`, `entry.updated`, or `entry.deleted` events.
- `POST /api/realtime/session` creates a one-time `rt_` session token only when the bearer content API token role has `getAll` for the schema.
- `GET /api/realtime?schema=:schemaSlug&session=rt_...` accepts a WebSocket connection only when realtime is enabled for that schema, then rejects reused or expired session tokens.
- A matching content write sends a WebSocket event with `eventId`, `messageId`, `event`, `schema`, `entry`, and `occurredAt`.
- A reconnect with `lastEventId=EVENT_ID` replays later events for the same schema with `replayed: true`.
- Realtime history keeps the latest 1000 events per schema and prunes older rows.
- The WebSocket client can send `{ "type": "ack", "messageId": "..." }` and receives `ack.ok`.
- A matching content write sends signed headers `x-apiagex-event`, `x-apiagex-webhook-id`, `x-apiagex-delivery-id`, `x-apiagex-timestamp`, and `x-apiagex-signature`.
- Receiver verification docs explain timestamp tolerance, delivery id replay checks, and HMAC validation.
- Failed webhook calls are logged in `GET /api/admin/webhooks/:webhookId/deliveries` without failing the content write.
- `POST /api/admin/users` creates a user with one API role.
- `POST /api/auth/login-user` logs in the user and returns `roleId`.
- Allowed dynamic API request returns `200`.
- Blocked dynamic API request returns `403 API_PERMISSION_DENIED`.
- Create relation schemas and entries, then call `GET /api/content/:schemaSlug/:entryId?populate=relations`.
- Expected: raw reads return relation ids, populated reads return related entry objects for readable target schemas, and populate stays one level deep.
- Create one allowed API role with `get` permission on source and target schemas, and one blocked API role with no `get` permission.
- Expected allowed outcome: populated relation request returns `200` and expands the related entry.
- Expected blocked outcome: source schema without `get` permission returns `403 API_PERMISSION_DENIED`; target schema without `get` permission returns `200` with that relation as `null`.

## Hinglish

### Browser Use Checks

- `/readme` open karke current status confirm karo.
- `/doc` open karke API examples confirm karo.
- `/adminui` open karke owner login karo.
- Ek text field ke saath schema create karo.
- Entries open karke confirm karo ki collections attached left submenu me dikhte hain.
- Generated entry form se entry create karo.
- Generated APIs me `/api/content/:schemaSlug` confirm karo.
- Settings open karke confirm karo ki left menu compact hota hai aur Admin Roles, Content Roles, Webhooks, plus Realtime API submenu options dikhte hain.
- Confirm karo ki Settings submenu items normal compact height me rahen aur content badhne par 100vh column ke andar scroll ho.
- Settings me custom admin role create karo aur ek admin permission save karo.
- Settings > Content Roles me API role create karo aur ek permission checkbox save karo.
- Selected Content Role ke liye API token create karo aur confirm karo ki full token sirf create ke baad dikhta hai.
- Settings > Webhooks open karo, verification docs link kholo, webhook create karo, matching entry write trigger karo, aur delivery log dikhna confirm karo.
- Settings > Realtime API open karo, ek collection enable karo, client docs link kholo, realtime session token create karo, `session=rt_...` ke saath WebSocket client connect karo, matching entry write trigger karo, realtime event plus ack confirm karo, phir fresh session plus `lastEventId` ke saath reconnect karke missed event replay confirm karo.
- Confirm karo ki Settings > Realtime API recent realtime event history aur retention count dikhata hai.
- Us API role ke saath user create karo.
- Confirm karo ki Users aur baaki non-doc Admin UI screens normal content height me rahen aur `English:` ya `Hinglish:` helper labels na dikhayen.
- Current page console errors nahi hone chahiye.
- Desktop aur narrow mobile layout me text readable aur controls non-overlap hone chahiye.

### Relation Modeling Checks

- `/adminui` me pehle target schema banao, phir `oneToOne`, `oneToMany`, `manyToOne`, aur `manyToMany` ke liye source schemas ya fields banao.
- Expected: har relation field chosen relation type aur target schema ke saath save ho, aur schema details me visible ho.
- Single relation picker aur multi relation picker ke saath entries create karo.
- Expected: single relation one entry id save kare; multi relation arrays save kare aur entry list me selected entry labels/counts dikhaye.
- Relation entry edit karo, save karo, `/adminui` reload karo, aur same schema dobara select karo.
- Expected: edited single aur multi relation values reload ke baad selected aur visible rahen.
- Narrow mobile viewport par `/adminui` check karo.
- Expected: relation type picker, target picker, entry picker, aur relation summaries readable rahen aur overlap na karein.
- `/doc` aur `/readme` open karo.
- Expected: relation types, payload examples, populate options, Admin UI flow, aur common errors documented hon.

### API Request Checks

- `GET /api/health` `{ "ok": true }` return kare.
- Fresh database par `POST /api/auth/bootstrap-owner` pehla owner create kare.
- `POST /api/auth/login` owner login kare.
- `POST /api/admin/schemas` schema create kare.
- `POST /api/admin/schemas/:schemaId/entries` entry create kare.
- `POST /api/content/:schemaSlug` dynamic content create kare.
- `GET /api/admin/roles` sirf API roles list kare aur `owner`, `admin`, `schema-manager`, `user-manager` exclude kare.
- `GET /api/admin/settings/access` admin roles aur API roles ko alag list kare.
- `PUT /api/admin/settings/access/admin-roles/:roleId/permissions` admin permissions ko content API permissions se alag save kare.
- `POST /api/admin/roles` API role create kare.
- `PUT /api/admin/roles/:roleId/permissions` permissions save kare.
- `POST /api/admin/roles/:roleId/tokens` one-time visible token create kare.
- `GET /api/content/:schemaSlug` `Authorization: Bearer TOKEN` ke saath work kare jab token role ke paas `getAll` ho.
- `DELETE /api/admin/roles/:roleId/tokens/:tokenId` token revoke kare aur same content request `403 API_TOKEN_INVALID` return kare.
- `POST /api/admin/webhooks` `entry.created`, `entry.updated`, ya `entry.deleted` ke liye webhook create kare.
- `PUT /api/admin/realtime/:schemaId` selected `entry.created`, `entry.updated`, ya `entry.deleted` events ke liye realtime enable kare.
- `POST /api/realtime/session` one-time `rt_` session token tabhi create kare jab bearer content API token role ke paas schema par `getAll` ho.
- `GET /api/realtime?schema=:schemaSlug&session=rt_...` WebSocket connection tabhi accept kare jab schema ke liye realtime enabled ho, phir reused ya expired session tokens reject kare.
- Matching content write `eventId`, `messageId`, `event`, `schema`, `entry`, aur `occurredAt` ke saath WebSocket event bheje.
- `lastEventId=EVENT_ID` ke saath reconnect same schema ke later events ko `replayed: true` ke saath replay kare.
- Realtime history har schema ke latest 1000 events rakhe aur purane rows prune kare.
- WebSocket client `{ "type": "ack", "messageId": "..." }` bhej sake aur `ack.ok` receive kare.
- Matching content write signed headers `x-apiagex-event`, `x-apiagex-webhook-id`, `x-apiagex-delivery-id`, `x-apiagex-timestamp`, aur `x-apiagex-signature` bheje.
- Receiver verification docs timestamp tolerance, delivery id replay checks, aur HMAC validation explain kare.
- Failed webhook calls `GET /api/admin/webhooks/:webhookId/deliveries` me log hon aur content write fail na ho.
- `/adminui#users` par user list pehle dikhe, phir Create user click karke one-API-role user create karo.
- `POST /api/admin/users` one-API-role user create kare.
- `POST /api/auth/login-user` user login kare aur `roleId` return kare.
- Allowed dynamic API request `200` return kare.
- Blocked dynamic API request `403 API_PERMISSION_DENIED` return kare.
- Relation schemas aur entries create karo, phir `GET /api/content/:schemaSlug/:entryId?populate=relations` call karo.
- Expected: raw reads relation ids return karein, populated reads readable target schemas ke liye related entry objects return karein, aur populate one level deep rahe.
- Ek allowed API role source aur target schemas ke `get` permission ke saath banao, aur ek blocked API role bina `get` permission ke banao.
- Expected allowed outcome: populated relation request `200` return kare aur related entry expand kare.
- Expected blocked outcome: source schema `get` permission missing ho to `403 API_PERMISSION_DENIED`; target schema `get` permission missing ho to `200` ke saath relation `null`.
