# Apiagex Project Context

Apiagex is being rebuilt from a fresh MVP baseline.

Apiagex fresh MVP baseline se dobara ban raha hai.

## Current State

- Previous implementation backup branch: `backup/pre-mvp-rebuild`
- Previous implementation backup tag: `backup-pre-mvp-rebuild`
- Package/workspace setup is preserved.
- Old implementation code was removed.
- New code must follow `tasks.md` only.
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
- `/doc` and `/readme` now document schema builder usage and relation rules.
- `/doc` aur `/readme` schema builder usage aur relation rules document karte hain.
- Schema builder checkpoint v0.3.5 is ready.
- Schema builder checkpoint v0.3.5 ready hai.
- Entry repository validates JSON entry data against schema fields and relation entry targets.
- Entry repository JSON entry data ko schema fields aur relation entry targets ke against validate karta hai.
- Entry admin APIs provide create, list, read, update, and delete under `/api/admin/schemas/:schemaId/entries`.
- Entry admin APIs `/api/admin/schemas/:schemaId/entries` ke under create, list, read, update, aur delete provide karte hain.
- React Admin UI generates entry forms from selected schema fields.
- React Admin UI selected schema fields se entry forms generate karta hai.
- Dynamic content APIs expose each schema slug under `/api/content/:schemaSlug`.
- Dynamic content APIs har schema slug ko `/api/content/:schemaSlug` ke under expose karte hain.
- Admin UI lists generated dynamic APIs for all schemas.
- Admin UI sab schemas ke generated dynamic APIs list karta hai.
- `/doc` and `/readme` include dynamic API usage examples.
- `/doc` aur `/readme` dynamic API usage examples include karte hain.
- Dynamic API checkpoint v0.4.6 is ready.
- Dynamic API checkpoint v0.4.6 ready hai.
- Role repository and `/api/admin/roles` APIs can create, list, and read non-owner roles.
- Role repository aur `/api/admin/roles` APIs non-owner roles create, list, aur read kar sakte hain.
- Permission model supports read, create, update, delete, and manage per role and schema.
- Permission model role aur schema ke hisab se read, create, update, delete, aur manage support karta hai.
- Admin UI Role Permissions screen can create roles and save dynamic API action checkboxes.
- Admin UI Role Permissions screen roles create kar sakta hai aur dynamic API action checkboxes save kar sakta hai.
- Dynamic APIs enforce allow/block when `x-apiagex-role-id` is present.
- Dynamic APIs `x-apiagex-role-id` present hone par allow/block enforce karte hain.
- User repository and `/api/admin/users` APIs create users assigned to exactly one role.
- User repository aur `/api/admin/users` APIs users ko exactly one role ke saath create karte hain.
- Admin UI Users screen creates and lists users with role assignment.
- Admin UI Users screen role assignment ke saath users create aur list karta hai.
- RBAC end-to-end flow verifies user login plus allowed and blocked dynamic API access.
- RBAC end-to-end flow user login aur allowed/blocked dynamic API access verify karta hai.
- `/doc` and `/readme` document RBAC allow/block examples.
- `/doc` aur `/readme` RBAC allow/block examples document karte hain.

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
- The current `/adminui` page includes Dashboard, Schemas, APIs, Roles, Users, and Docs navigation.

### Owner And Auth

- The first successful bootstrap login creates or activates the owner.
- Owner has full access and cannot be blocked by role permissions.
- Later users must be created by an allowed owner/admin flow.
- A user belongs to exactly one role for MVP simplicity.

### Schema Builder

- A schema is an API definition with name, slug, description, and fields.
- Field types: text, long text, number, boolean, date, JSON, media, relation.
- Slugs must be unique and URL safe.
- Relation fields reference another schema by stable schema id/slug.
- Relations must validate target schema existence before save.

### Dynamic APIs

- Every schema creates API routes under `/api/content/:schemaSlug`.
- MVP actions: list, read, create, update, delete.
- Admin UI must show every generated API with docs and examples.
- API behavior must match schema validation and relation rules.

### RBAC

- Owner can create unlimited roles.
- Permissions are assigned per role, per dynamic API, per action.
- Actions: read, create, update, delete, manage.
- Checked means allowed; unchecked means blocked by default.
- Permission verification must test an allowed user and blocked user.

## Verification Contract

- Browser Use is required for Admin UI, `/doc`, and `/readme` checks.
- API changes require automated tests and one manual request flow.
- RBAC changes require a real role+user+API allow/block verification.
- Every completed task must update docs where relevant and be committed.

## Next Step

The next pending task is `T035`: release MVP RBAC checkpoint.

## Coding Rules

- Keep files below 250 lines.
- Use strict TypeScript.
- Put shared types in matching `*.type.ts` files.
- Keep one server for `/api`, `/adminui`, `/doc`, and `/readme`.
- Build real Admin UI screens in React, not inline server HTML.
