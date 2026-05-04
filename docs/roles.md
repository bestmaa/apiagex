# Role Catalog

## English

The `/admin/roles` API manages the dynamic role catalog.

Each role stores:

- `id`
- `name`
- `description`
- `permissions` as a JSON object

Bootstrap roles are seeded as built-ins. Built-in roles cannot be deleted.

Current access pattern:

- `owner` and `admin` can manage roles
- `editor` and `viewer` keep using the existing authenticated APIs through the content-type permission defaults
- custom roles can define `content-types:<slug>` permission scopes, and those catalog permissions are evaluated first for authenticated requests
- if a role catalog entry does not define a scope for a content type, the current content-type permission matrix remains the fallback

RBAC V2 will standardize these scopes across system, tenant, content, media, webhook, backup, realtime, and raw API routes. See `permission-scopes.md`.

## Hindi

`/admin/roles` API dynamic role catalog manage karti hai.

Har role me ye values store hoti hain:

- `id`
- `name`
- `description`
- `permissions` JSON object ke roop me

Bootstrap roles built-in ke roop me seed hote hain. Built-in roles delete nahi kiye ja sakte.

Current access pattern:

- `owner` aur `admin` roles manage kar sakte hain
- `editor` aur `viewer` existing authenticated APIs ko content-type permission defaults ke through use karte hain
- custom roles `content-types:<slug>` permission scopes define kar sakte hain, aur authenticated requests me pehle wahi catalog permissions evaluate hoti hain
- agar role catalog entry kisi content type ke liye scope define nahi karti, to current content-type permission matrix fallback rahegi

RBAC V2 in scopes ko system, tenant, content, media, webhook, backup, realtime, aur raw API routes par standard karega. `permission-scopes.md` dekho.
