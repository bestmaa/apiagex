# Admin UI

## English

The admin UI now includes login, role-aware content type editing, field management, field-driven entry forms, and a read-only mode for viewer accounts.

Content type cards also expose a Duplicate action that clones the current schema into a new content type.

Role-aware behavior:

- `admin` can create, edit, and delete content types, fields, and entries.
- `editor` can read content types and fields, and can manage entries.
- `viewer` sees read-only lists.

The UI stores the bearer token and role in localStorage after `/auth/login` succeeds.

It also stores the expiry time and automatically shows the login screen again when the session expires or the API returns `401`.

An admin-only audit log viewer loads `/api/audit-logs` and shows content-type, field, and entry mutations.

Relation fields can point at another content type and store related entry IDs from the field-driven entry form.

The media library panel uploads files through `/api/media-files`, stores them under `/uploads/`, and exposes uploaded ids to media fields.

The webhooks panel registers outbound targets through `/api/webhooks` and shows delivery history for each webhook.

Failed webhook deliveries retry with backoff, and the delivery list shows attempt count plus status.

The content type form now has a Realtime section with a master toggle plus Create, Update, and Delete action toggles. If the master toggle is off, the action toggles stay disabled. The save payload includes `realtimeEnabled` and `realtimeActions`.

The admin shell listens to the realtime stream and refreshes the content type list, selected entries, media files, and audit log when matching updates arrive.

An admin-only ops panel reads `/api/health/detail` and shows the service status, cache flags, storage driver, uploads path, and scheduler state.

Each entry card also has a preview action that requests a signed preview URL from the admin API and opens the draft preview in a new tab.

The entry form now supports `draft`, `scheduled`, and `published` states. When `scheduled` is selected, the `Publish at` field becomes active and the server publishes the entry automatically once the scheduled time is reached.

The entry screen also includes a Versions panel. It loads snapshots from `/api/content-types/:id/entries/:entryId/versions` and can restore an older version through the admin API.

The Versions panel also supports compare mode. It shows the current form state side by side with a saved snapshot so editors can review field-level changes before restoring.

The entry screen also supports `pendingApproval`. Admin users can approve a pending entry into `published` or reject it back to `draft`.

The entries panel also includes a pending-approval filter so the approval queue can be reviewed separately.

The entries panel also supports search, page size, sort order, and next/previous pagination controls. Search runs against the current content type entries, page size can be 5, 10, or 25, and sort order can switch between newest and oldest.

The entries panel also supports current-page bulk actions. Select rows individually or select the current page, then bulk approve, publish, unpublish, or delete the selected entries.

## Hindi

Admin UI me login, role-aware content type editing, field management, field-driven entry forms, aur viewer accounts ke liye read-only mode already hai.

Content type cards me Duplicate action bhi hai jo current schema ko new content type me clone karta hai.

Role-aware behavior:

- `admin` content types, fields, aur entries ko create, edit, aur delete kar sakta hai.
- `editor` content types aur fields ko read kar sakta hai, aur entries ko manage kar sakta hai.
- `viewer` sirf read-only lists dekhta hai.

UI `/auth/login` successful hone ke baad bearer token aur role localStorage me store karta hai.

Ye expiry time bhi store karta hai aur session expire hone ya API ke `401` return karne par login screen par wapas aa jata hai.

Admin-only audit log viewer `/api/audit-logs` se content-type, field, aur entry mutations dikhata hai.

Relation fields doosre content type ko point kar sakte hain aur field-driven entry form se related entry IDs store karte hain.

Media library panel `/api/media-files` se files upload karta hai, unhe `/uploads/` me store karta hai, aur media fields ko uploaded ids deta hai.

Webhooks panel `/api/webhooks` ke through outbound targets register karta hai aur har webhook ki delivery history dikhata hai.

Failed webhook deliveries backoff ke saath retry hoti hain, aur delivery list attempt count aur status dikhati hai.

Content type form me ab Realtime section hai jisme master toggle aur Create, Update, Delete action toggles hain. Agar master toggle off hai to action toggles disabled rehte hain. Save payload me `realtimeEnabled` aur `realtimeActions` dono jate hain.

Admin shell realtime stream sunta hai aur matching updates par content type list, selected entries, media files, aur audit log refresh karta hai.

Admin-only ops panel `/api/health/detail` se service status, cache flags, storage driver, uploads path, aur scheduler state dikhata hai.

Har entry card me preview action bhi hota hai jo admin API se signed preview URL mangta hai aur draft preview ko new tab me open karta hai.

Entry form me ab `draft`, `scheduled`, aur `published` states hain. Jab `scheduled` select hota hai, `Publish at` field active ho jata hai aur server scheduled time aane par entry ko automatically publish kar deta hai.

Entry screen me Versions panel bhi hai. Ye `/api/content-types/:id/entries/:entryId/versions` se snapshots load karta hai aur admin API se purana version restore kar sakta hai.

Versions panel compare mode bhi support karta hai. Ye current form state ko saved snapshot ke saath side by side dikhata hai, taaki editor restore karne se pehle field-level changes dekh sake.

Entry screen `pendingApproval` bhi support karti hai. Admin users pending entry ko `published` me approve ya `draft` me reject kar sakte hain.

Entries panel me pending-approval filter bhi hai, taaki approval queue alag se dekhi ja sake.

Entries panel me search, page size, sort order, aur next/previous pagination controls bhi hain. Search current content type entries par chalti hai, page size 5, 10, ya 25 ho sakta hai, aur sort order newest/oldest ke beech switch hota hai.

Entries panel me current-page bulk actions bhi hain. Rows ko individually select karo ya current page select karo, phir selected entries ko bulk approve, publish, unpublish, ya delete karo.
