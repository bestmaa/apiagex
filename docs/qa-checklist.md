# Apiagex MVP QA Checklist

## English

### Browser Use Checks

- Open `/readme` and confirm current status is visible.
- Open `/doc` and confirm API examples are visible.
- Open `/adminui` and login as owner.
- Create a schema with one text field.
- Create an entry from the generated entry form.
- Confirm Generated APIs shows `/api/content/:schemaSlug`.
- Create a role and save at least one permission checkbox.
- Create a user assigned to that role.
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
- `POST /api/admin/roles` creates a role.
- `PUT /api/admin/roles/:roleId/permissions` saves permissions.
- `POST /api/admin/users` creates a user with one role.
- `POST /api/auth/login-user` logs in the user and returns `roleId`.
- Allowed dynamic API request returns `200`.
- Blocked dynamic API request returns `403 API_PERMISSION_DENIED`.
- Create relation schemas and entries, then call `GET /api/content/:schemaSlug/:entryId?populate=relations`.
- Expected: raw reads return relation ids, populated reads return related entry objects for readable target schemas, and populate stays one level deep.
- Create one allowed role with `get` permission on source and target schemas, and one blocked role with no `get` permission.
- Expected allowed outcome: populated relation request returns `200` and expands the related entry.
- Expected blocked outcome: source schema without `get` permission returns `403 API_PERMISSION_DENIED`; target schema without `get` permission returns `200` with that relation as `null`.

## Hinglish

### Browser Use Checks

- `/readme` open karke current status confirm karo.
- `/doc` open karke API examples confirm karo.
- `/adminui` open karke owner login karo.
- Ek text field ke saath schema create karo.
- Generated entry form se entry create karo.
- Generated APIs me `/api/content/:schemaSlug` confirm karo.
- Role create karo aur ek permission checkbox save karo.
- Us role ke saath user create karo.
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
- `POST /api/admin/roles` role create kare.
- `PUT /api/admin/roles/:roleId/permissions` permissions save kare.
- `POST /api/admin/users` one-role user create kare.
- `POST /api/auth/login-user` user login kare aur `roleId` return kare.
- Allowed dynamic API request `200` return kare.
- Blocked dynamic API request `403 API_PERMISSION_DENIED` return kare.
- Relation schemas aur entries create karo, phir `GET /api/content/:schemaSlug/:entryId?populate=relations` call karo.
- Expected: raw reads relation ids return karein, populated reads readable target schemas ke liye related entry objects return karein, aur populate one level deep rahe.
- Ek allowed role source aur target schemas ke `get` permission ke saath banao, aur ek blocked role bina `get` permission ke banao.
- Expected allowed outcome: populated relation request `200` return kare aur related entry expand kare.
- Expected blocked outcome: source schema `get` permission missing ho to `403 API_PERMISSION_DENIED`; target schema `get` permission missing ho to `200` ke saath relation `null`.
