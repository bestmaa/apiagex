# Apiagex Project Context

Apiagex is being rebuilt from a fresh MVP baseline.

## Current State

- The previous implementation is backed up at Git branch `backup/pre-mvp-rebuild`.
- The same commit is also tagged as `backup-pre-mvp-rebuild`.
- Project/package setup is preserved.
- Current package implementation folders were removed:
  - `packages/*/src`
  - `packages/*/tests`
  - `packages/*/dist`
- The next code must be written fresh from the user's MVP instructions.

## Preserved Setup

- Root npm workspace remains in `package.json`.
- Package folders remain under `packages/`.
- Root docs, scripts, package metadata, and Git history remain unless a future task changes them.
- Development target stays one server with `/api`, `/docs`, `/readme`, and `/adminui`.

## Fresh MVP Direction

The MVP should feel like a Stripe-style headless CMS/API platform:

- Owner logs in.
- Owner creates a schema/API from Admin UI.
- Owner adds fields and saves the schema.
- Owner creates entries for that schema.
- System generates API endpoints automatically.
- Admin UI shows generated API docs and examples.
- Owner assigns allow/block permissions per API and role.
- Browser Use, automated tests, manual API requests, docs, and commits are required after each completed task.

## Next Step

Do not code product behavior until the user gives the fresh MVP flow details. The next pending task is `T002` in `tasks.md`: capture and confirm the fresh MVP flow.

## Do Not Forget

- Keep every file below 250 lines.
- Keep strict TypeScript when code returns.
- Use matching `*.type.ts` files for shared types.
- Write docs in English and Hinglish.
- Use Browser Use for Admin UI/docs checks.
- Commit every completed task.
