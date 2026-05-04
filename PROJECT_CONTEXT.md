# Apiagex Project Context

Apiagex is being rebuilt from a fresh MVP baseline.

Apiagex fresh MVP baseline se dobara ban raha hai.

## Current State

- Previous implementation backup branch: `backup/pre-mvp-rebuild`
- Previous implementation backup tag: `backup-pre-mvp-rebuild`
- Package/workspace setup is preserved.
- Old implementation code was removed.
- New code must follow `tasks.md` only.

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

## Verification Contract

- Browser Use is required for Admin UI, `/doc`, and `/readme` checks.
- API changes require automated tests and one manual request flow.
- RBAC changes require a real role+user+API allow/block verification.
- Every completed task must update docs where relevant and be committed.

## Next Step

The next pending task is `T003`: write the detailed MVP product contract in docs and project context before coding implementation.

## Coding Rules

- Keep files below 250 lines.
- Use strict TypeScript.
- Put shared types in matching `*.type.ts` files.
- Keep one server for `/api`, `/adminui`, `/doc`, and `/readme`.
