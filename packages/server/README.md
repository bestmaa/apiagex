# @apiagex/server

## English

This package owns the Fastify API server. It serves the docs page at `/docs`, health status at `/health`, and a starter admin content-type API at `/admin/content-types`.

MVP note: current routes use `/api`, `/adminui`, `/doc`, and `/readme`. `/api/admin/roles` exposes content API roles only, while control-plane roles stay separate as `owner`, `admin`, `schema-manager`, and `user-manager`. Content API permission checks reject admin roles even when their ids are sent in `x-apiagex-role-id`.

Every request gets an `x-request-id` response header, and structured request start/end/error logs carry the same request id.

The detailed health route is available at `/health/detail`.

That health detail payload includes the storage driver, uploads path, cache flags, scheduler status, and the request-id header name.

The server also adds `x-request-id` to every response and writes structured request start/end/error logs with the same request id.

Admin routes require a bearer token from `POST /auth/login`.

The login flow supports four roles when configured: `owner`, `admin`, `editor`, and `viewer`.

- `owner` can read and write everything, and can manage the role catalog.
- `admin` can read and write content types, fields, and entries.
- `editor` can read content types and fields, and can read/write entries.
- `viewer` can only read admin data.

The content-type routes are backed by a local SQLite file and persist `content_types` plus `content_fields` rows on disk.

The role catalog is available at `/admin/roles`. It stores `id`, `name`, `description`, and a JSON `permissions` object in the same SQLite file, and built-in roles cannot be deleted.

The field routes are available at `/admin/content-types/:id/fields` for list, create, update, and delete.

The entry routes are available at `/admin/content-types/:id/entries` for list, create, update, and delete.

Entry writes are validated against the saved field schema before they are stored.

Media files are available at `/admin/media-files` for upload and listing, and uploaded assets are served from `/uploads/`.

Media storage uses a local-disk adapter by default. Set `MEDIA_STORAGE_DRIVER=local` to keep the default, or use `s3` / `minio` as future driver placeholders.

Audit logs are written to the same SQLite file on every content-type, field, and entry create/update/delete action.

The admin-only audit log reader is available at `/admin/audit-logs`.

Webhook registrations live at `/admin/webhooks`, and webhook deliveries are listed at `/admin/webhooks/:id/deliveries`.

Webhook events are emitted from the same audit-backed mutation path and can be delivered to external targets with optional signatures.

Failed webhook deliveries retry with a short backoff, and each delivery row tracks attempt count, status, and next retry time.

The admin backup export route lives at `/admin/backups/export`, restore lives at `/admin/backups/restore`, and schema migration history is available at `/admin/migrations`.

Content types now support an opt-in `realtimeEnabled` master flag plus per-action `realtimeActions` settings. When `realtimeEnabled` is true, the server exposes `/realtime/stream` as a Server-Sent Events feed for the enabled create/update/delete actions on that content type.

The admin shell can subscribe to the same stream and refresh content types, entries, media, and audit data when matching events arrive.

Public read routes are available at `/api/:slug` and `/api/:slug/:entryId`. Collection types return published items; single types return one published item.

Public read routes support `populate=relations`, `populate=media`, or `populate=all` / `populate=*` for one-level field resolution. Relations return published public entries, and media return public file records with `/uploads/` URLs.

Public read responses also use a short TTL cache for published content, and the cache clears on content, media, and restore writes.

Draft preview support is available through signed preview tokens issued by `POST /admin/content-types/:id/entries/:entryId/preview`. Public routes accept `?preview=...` and can return the draft entry for that signed URL.

Entries can also be marked `scheduled` with a `publishAt` timestamp. A background sweep publishes due entries automatically, and the public API only exposes entries after they reach `published`.

Entries also keep version snapshots. The server stores a snapshot on create, update, scheduled publish, and rollback restore. Admin routes can list versions at `/admin/content-types/:id/entries/:entryId/versions` and restore an older version with `POST /admin/content-types/:id/entries/:entryId/versions/:versionId/restore`.

Entries can also be marked `pendingApproval`. Admin-only routes at `/admin/content-types/:id/entries/:entryId/approve` and `/admin/content-types/:id/entries/:entryId/reject` transition a pending entry to `published` or back to `draft`.

The admin list route also accepts `?status=pendingApproval` to show only entries waiting for approval.

The admin list route also accepts `q`, `page`, `pageSize`, and `sort` query parameters for search, pagination, and newest/oldest sorting.

The admin search route is available at `/admin/search` and returns content type, entry, and media matches for the logged-in role.

Content types can be duplicated through `POST /admin/content-types/:id/duplicate`. Self-relation fields are rewritten to point at the cloned slug.

Authentication uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET`. Optional `OWNER_EMAIL` / `OWNER_PASSWORD`, `EDITOR_EMAIL` / `EDITOR_PASSWORD`, and `VIEWER_EMAIL` / `VIEWER_PASSWORD` accounts can also be configured.

In local development the defaults are `admin@example.com`, `secret123`, and `apiagex-dev-secret`.

Local development persistence defaults to `.apiagex/apiagex.sqlite`, and local uploads are reserved under `.apiagex/uploads`. Override them with `APIAGEX_DATABASE_PATH` and `APIAGEX_UPLOADS_PATH`.

Run it with:

```bash
npm run dev -w @apiagex/server
```

## Hindi

Ye package Fastify API server ka owner hai. Ye `/docs` par docs page, `/health` par health status, aur `/admin/content-types` par starter admin content-type API serve karta hai.

MVP note: current routes `/api`, `/adminui`, `/doc`, aur `/readme` use karte hain. `/api/admin/roles` sirf content API roles expose karta hai, aur control-plane roles `owner`, `admin`, `schema-manager`, `user-manager` ke roop me alag rahte hain. Content API permission checks admin roles reject karte hain, chahe unka id `x-apiagex-role-id` me bheja gaya ho.

Har request ko `x-request-id` response header milta hai, aur structured request start/end/error logs usi request id ko carry karte hain.

Detailed health route `/health/detail` par available hai.

Ye health detail payload storage driver, uploads path, cache flags, scheduler status, aur request-id header name bhi dikhata hai.

Server har response me `x-request-id` bhi add karta hai aur same request id ke saath structured request start/end/error logs likhta hai.

Admin routes ke liye `POST /auth/login` se bearer token lena hota hai.

Login flow me four roles support hote hain jab configure kiye gaye hon: `owner`, `admin`, `editor`, aur `viewer`.

- `owner` sab kuch read/write kar sakta hai aur role catalog manage kar sakta hai.
- `admin` content types, fields, aur entries ko read aur write kar sakta hai.
- `editor` content types aur fields ko read kar sakta hai, aur entries ko read/write kar sakta hai.
- `viewer` sirf admin data read kar sakta hai.

Content-type routes local SQLite file se backed hain aur `content_types` aur `content_fields` rows disk par persist karti hain.

Role catalog `/admin/roles` par available hai. Ye same SQLite file me `id`, `name`, `description`, aur JSON `permissions` object store karta hai, aur built-in roles delete nahi kiye ja sakte.

Field routes `/admin/content-types/:id/fields` par list, create, update, aur delete ke liye available hain.

Entry routes `/admin/content-types/:id/entries` par list, create, update, aur delete ke liye available hain.

Entry writes save hone se pehle saved field schema ke against validate hoti hain.

Media files `/admin/media-files` par upload aur list hoti hain, aur uploaded assets `/uploads/` se serve hote hain.

Media storage default me local-disk adapter use karti hai. `MEDIA_STORAGE_DRIVER=local` default ke liye hai, aur `s3` / `minio` future driver placeholders hain.

Har content-type, field, aur entry create/update/delete action par audit logs same SQLite file me write hote hain.

Admin-only audit log reader `/admin/audit-logs` par available hai.

Webhook registrations `/admin/webhooks` par live hain, aur deliveries `/admin/webhooks/:id/deliveries` par list hoti hain.

Webhook events same audit-backed mutation path se emit hote hain aur optional signatures ke saath external targets tak deliver ho sakte hain.

Failed webhook deliveries short backoff ke saath retry hoti hain, aur har delivery row attempt count, status, aur next retry time track karti hai.

Admin backup export route `/admin/backups/export` par hai, restore `/admin/backups/restore` par hai, aur schema migration history `/admin/migrations` par available hai.

Content types me ab opt-in `realtimeEnabled` master flag aur per-action `realtimeActions` settings support hai. Jab `realtimeEnabled` true hota hai, server `/realtime/stream` par Server-Sent Events feed expose karta hai jo enabled create/update/delete actions ke live updates deta hai.

Admin shell isi stream ko subscribe karke matching updates par content types, entries, media, aur audit data refresh kar sakta hai.

Public read routes `/api/:slug` aur `/api/:slug/:entryId` par available hain. Collection types published items return karti hain; single types ek published item return karti hain.

Public read routes `populate=relations`, `populate=media`, ya `populate=all` / `populate=*` ke saath one-level field resolution support karti hain. Relations published public entries return karti hain, aur media public file records ko `/uploads/` URLs ke saath return karti hain.

Public read responses bhi published content ke liye short TTL cache use karti hain, aur content, media, aur restore writes par cache clear hota hai.

Draft preview support `POST /admin/content-types/:id/entries/:entryId/preview` se issue hue signed preview tokens ke through available hai. Public routes `?preview=...` accept karti hain aur us signed URL ke liye draft entry return kar sakti hain.

Entries ko `scheduled` status aur `publishAt` timestamp ke saath save kiya ja sakta hai. Background sweep due entries ko automatically publish karta hai, aur public API entry ko tabhi expose karti hai jab wo `published` ho jaye.

Entries ke version snapshots bhi save hote hain. Server create, update, scheduled publish, aur rollback restore par snapshot store karta hai. Admin routes `/admin/content-types/:id/entries/:entryId/versions` par versions list karti hain, aur `POST /admin/content-types/:id/entries/:entryId/versions/:versionId/restore` se purana version restore hota hai.

Entries `pendingApproval` bhi ho sakti hain. Admin-only routes `/admin/content-types/:id/entries/:entryId/approve` aur `/admin/content-types/:id/entries/:entryId/reject` pending entry ko `published` ya `draft` me transition karti hain.

Admin list route `?status=pendingApproval` bhi accept karti hai taaki sirf approval queue dikh sake.

Admin list route `q`, `page`, `pageSize`, aur `sort` query parameters bhi accept karti hai search, pagination, aur newest/oldest sorting ke liye.

Admin search route `/admin/search` par available hai aur logged-in role ke hisaab se content type, entry, aur media matches return karti hai.

Content types ko `POST /admin/content-types/:id/duplicate` se duplicate kiya ja sakta hai. Self-relation fields cloned slug par rewrite ho jati hain.

Authentication `ADMIN_EMAIL`, `ADMIN_PASSWORD`, aur `AUTH_SECRET` use karti hai. Optional `OWNER_EMAIL` / `OWNER_PASSWORD`, `EDITOR_EMAIL` / `EDITOR_PASSWORD`, aur `VIEWER_EMAIL` / `VIEWER_PASSWORD` accounts bhi configure kiye ja sakte hain.

Local development persistence default me `.apiagex/apiagex.sqlite` use karta hai, aur local uploads `.apiagex/uploads` ke under reserved hain. Inko `APIAGEX_DATABASE_PATH` aur `APIAGEX_UPLOADS_PATH` se override kar sakte ho.

Local development me defaults `admin@example.com`, `secret123`, aur `apiagex-dev-secret` hain.

Run karne ke liye:

```bash
npm run dev -w server
```
