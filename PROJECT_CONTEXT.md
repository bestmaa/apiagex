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

The next pending task is `T009`: add SQLite foundation, migrations, and MVP tables.

## Coding Rules

- Keep files below 250 lines.
- Use strict TypeScript.
- Put shared types in matching `*.type.ts` files.
- Keep one server for `/api`, `/adminui`, `/doc`, and `/readme`.
