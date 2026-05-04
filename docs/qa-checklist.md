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
