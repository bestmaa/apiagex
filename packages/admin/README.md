# @apiagex/admin

## English

This package owns the first admin UI scaffold. It provides a small local screen for listing, creating, editing, and deleting content types through the starter admin API.

MVP note: the current `/adminui` Role screen shows API roles only. Owner/admin control-plane roles are hidden from content API permissions, and the Users screen assigns exactly one API role to each content API user.

The UI starts with a login screen and stores the bearer token in localStorage after `/auth/login` succeeds.

The returned role is also stored with the session so the UI can hide admin-only content type actions and editor/viewer read-only controls.

The UI also stores the token expiry time and automatically returns to the login screen when the session expires or the server returns `401`.

The form also syncs content fields through `/api/content-types/:id/fields`.

The UI also has a field-driven entries panel that loads content type fields and saves entries through `/api/content-types/:id/entries`.

Entry widgets adapt to field types like text, number, date, boolean, rich text, and repeatable values.

Relation fields can target another content type and store related entry IDs in the entries panel.

The UI also includes a media library panel that uploads files through `/api/media-files` and makes uploaded file IDs available to media fields.

The UI also includes an admin-only audit log viewer backed by `/api/audit-logs`.

The UI also includes an admin-only webhooks panel that registers outbound targets and inspects delivery history through `/api/webhooks`.

Retrying webhook deliveries show attempt counts and delivery status in the panel.

The UI also includes an admin-only backup panel that exports and restores the full CMS bundle through `/api/backups/export` and `/api/backups/restore`.

The UI also includes an admin-only migrations panel that reads schema history through `/api/migrations`.

Content types also expose a realtime toggle. When enabled, the server can stream live updates for that content type through `/realtime/stream`.

The admin shell subscribes to the realtime stream and refreshes content types, entries, media, and audit data when matching updates arrive.

The public read API can now resolve relations and media with `populate`, which makes the admin-managed schema more useful for consumers.

Each entry card also exposes a preview action that requests a signed preview URL from the admin API and opens the draft view in a new tab.

The entry form also supports `scheduled` publishing with a `Publish at` field. When an editor selects `scheduled`, the server publishes the entry automatically after that time.

The entry panel also includes a Versions view. It loads entry snapshots from the admin API and lets admins restore an older revision.

The Versions view also has a compare mode that shows the current form state against a saved snapshot, field by field.

The entry screen also supports `pendingApproval`. Admin users can approve a pending entry into `published` or reject it back to `draft`.

The entries panel also has a pending-approval filter so admins can focus on the queue.

The entries panel also supports search, page size, sort order, and next/previous pagination controls. Search runs against the current content type entries, page size can be 5, 10, or 25, and sort order can switch between newest and oldest.

The entries panel also supports current-page bulk actions. Select rows individually or select the current page, then bulk approve, publish, unpublish, or delete the selected entries.

The admin shell also includes a global search panel that queries `/api/search` and opens matching content types, entries, or media files.

Content type cards also expose a Duplicate action that clones the schema and opens the copy workflow.

The admin shell also includes an admin-only ops panel that reads `/api/health/detail` and shows the service status, cache flags, storage driver, uploads path, and scheduler state.

Role-aware UI behavior:

- `admin` can create, edit, and delete content types, fields, and entries.
- `editor` can read content types and fields, and can manage entries.
- `viewer` sees read-only lists.

Run it with:

```bash
npm run dev -w @apiagex/admin
```

The UI expects the API server to run at `http://127.0.0.1:4000` by default.

## Hindi

Ye package first admin UI scaffold ka owner hai. Ye starter admin API ke through content types ko list, create, edit, aur delete karne ka local screen deta hai.

MVP note: current `/adminui` Role screen sirf API roles dikhata hai. Owner/admin control-plane roles content API permissions se hidden hain, aur Users screen har content API user ko exactly one API role assign karta hai.

UI login screen se start hota hai aur `/auth/login` successful hone ke baad bearer token localStorage me store karta hai.

Returned role bhi session ke saath store hoti hai, taaki UI admin-only content type actions aur editor/viewer read-only controls ko hide kar sake.

UI token expiry time bhi store karta hai aur session expire hone ya server ke `401` dene par automatically login screen par wapas aa jata hai.

Form content fields ko bhi `/api/content-types/:id/fields` ke through sync karta hai.

UI me field-driven entries panel bhi hai jo content type fields load karke `/api/content-types/:id/entries` ke through entries save karta hai.

Entry widgets text, number, date, boolean, rich text, aur repeatable values ke hisaab se adapt hote hain.

Relation fields doosre content type ko target kar sakte hain aur entries panel me related entry IDs store karte hain.

UI me media library panel bhi hai jo `/api/media-files` ke through files upload karta hai aur media fields ke liye uploaded file IDs available karta hai.

UI me admin-only audit log viewer bhi hai jo `/api/audit-logs` se data leta hai.

UI me admin-only webhooks panel bhi hai jo outbound targets register karta hai aur `/api/webhooks` ke through delivery history inspect karta hai.

Retrying webhook deliveries panel me attempt count aur delivery status ke saath dikhti hain.

UI me admin-only backup panel bhi hai jo `/api/backups/export` aur `/api/backups/restore` ke through full CMS bundle export aur restore karta hai.

UI me admin-only migrations panel bhi hai jo `/api/migrations` ke through schema history read karta hai.

Content types me realtime toggle bhi hai. Jab ye enabled hota hai, server `/realtime/stream` ke through us content type ke live updates stream kar sakta hai.

Admin shell realtime stream subscribe karta hai aur matching updates par content types, entries, media, aur audit data refresh karta hai.

Public read API ab `populate` ke saath relations aur media resolve kar sakti hai, isliye admin-managed schema consumers ke liye zyada useful ho jata hai.

Har entry card me preview action bhi hota hai jo admin API se signed preview URL mangta hai aur draft view ko new tab me open karta hai.

Entry form me `scheduled` publishing aur `Publish at` field bhi hai. Editor `scheduled` select kare to server us entry ko us time ke baad automatically publish karta hai.

Entry panel me Versions view bhi hai. Ye admin API se entry snapshots load karta hai aur admin ko purana revision restore karne deta hai.

Versions view me compare mode bhi hai. Ye current form state ko saved snapshot ke saath field-by-field compare karta hai.

Entry screen `pendingApproval` bhi support karti hai. Admin users pending entry ko `published` me approve ya `draft` me reject kar sakte hain.

Entries panel me pending-approval filter bhi hai, taaki admin queue par focus kar sake.

Entries panel me search, page size, sort order, aur next/previous pagination controls bhi hain. Search current content type entries par chalti hai, page size 5, 10, ya 25 ho sakta hai, aur sort order newest/oldest ke beech switch hota hai.

Entries panel me current-page bulk actions bhi hain. Rows ko individually select karo ya current page select karo, phir selected entries ko bulk approve, publish, unpublish, ya delete karo.

Admin shell me global search panel bhi hai jo `/api/search` ko query karta hai aur matching content types, entries, ya media files open karta hai.

Content type cards me Duplicate action bhi hai jo schema clone karke copy workflow start karta hai.

Admin shell me ek admin-only ops panel bhi hai jo `/api/health/detail` se service status, cache flags, storage driver, uploads path, aur scheduler state dikhata hai.

Role-aware UI behavior:

- `admin` content types, fields, aur entries ko create, edit, aur delete kar sakta hai.
- `editor` content types aur fields ko read kar sakta hai, aur entries ko manage kar sakta hai.
- `viewer` sirf read-only lists dekhta hai.

Run karne ke liye:

```bash
npm run dev -w @apiagex/admin
```

UI by default `http://127.0.0.1:4000` par API server expect karta hai.
