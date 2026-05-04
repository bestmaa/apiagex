# Apiagex Fresh MVP Task Queue

This queue follows the user's fresh MVP: one server, four paths, owner bootstrap, Admin UI schema builder, dynamic APIs, roles, permissions, and users.
Ye queue user ke fresh MVP ke hisab se hai: ek server, chaar path, owner bootstrap, Admin UI schema builder, dynamic APIs, roles, permissions, aur users.

## Rules

- Work one task at a time. Pick first `Status: pending`.
- Mark it `in_progress`, finish it, verify it, document it, then mark `completed`.
- Commit after every completed task with the listed commit message.
- Do not start coding product behavior not written in this file.
- Keep package/workspace setup unless a task says to change it.
- Keep every file below 250 lines.
- Use strict TypeScript. Avoid `any`; document if unavoidable.
- Put shared types in matching `*.type.ts` files.
- Docs must be English + Hinglish for every feature.
- One local server only. Required paths: `/doc`, `/readme`, `/adminui`, `/api`.
- Build Admin UI screens in React and serve the built app from the API server.
- Every backend feature needs automated tests and one manual API request check.
- Every Admin UI feature needs Browser Use verification at `/adminui`.
- Every docs/readme feature needs Browser Use verification at `/doc` and `/readme`.
- Permission tasks must verify allow and block with a real role/user/API flow.
- Current backup: branch `backup/pre-mvp-rebuild`, tag `backup-pre-mvp-rebuild`.

## Standard Verification

```powershell
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm run check"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm audit --audit-level=high"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && git diff --check"
```

Use `npm run smoke` only after the smoke test exists.

## GPT-5.5 Low-Token Prompt

```text
Apiagex MVP runner.
Read agent.md, PROJECT_CONTEXT.md, tasks.md. Pick first pending task only.
MVP paths: /doc /readme /adminui /api on one server.
Do not invent behavior beyond current task. Files <250 lines. Strict TS. Types in *.type.ts.
Docs in English+Hinglish. Tests for backend. Browser Use for /adminui /doc /readme.
For role/permission tasks, create role+user and verify allowed API works and blocked API fails.
Run npm run check, npm audit --audit-level=high, git diff --check. Commit completed task.
```

## MVP Flow Contract

- First screen routes: `/doc`, `/readme`, `/adminui`, `/api`.
- First login creates/uses the owner account.
- Owner can create schemas from Admin UI.
- Schema fields include at least text, long text, number, boolean, date, JSON, relation, and media.
- Relations must be designed before generated API/UI use them.
- Each schema becomes a dynamic API.
- Admin UI lists all dynamic APIs.
- Roles can be created in any number.
- Each role can be allowed/blocked per dynamic API action.
- Users can be created and assigned to a role.
- A user only sees/accesses APIs allowed by their role.

## Queue

### Phase 0: Fresh Reset And MVP Contract

- T001 | Version: reset | Status: completed | Goal: Back up old code and remove previous implementation while preserving setup. | Verify: backup branch/tag and clean reset commit. | Commit: `Reset implementation for fresh MVP`
- T002 | Version: spec | Status: completed | Goal: Capture fresh MVP flow: `/doc`, `/readme`, `/adminui`, `/api`, owner, schema, dynamic API, role permissions, users. | Verify: user-provided flow documented. | Commit: `Document fresh MVP flow`
- T003 | Version: spec | Status: completed | Goal: Write detailed MVP product contract in docs/README and PROJECT_CONTEXT with English+Hinglish. | Verify: docs review and line count. | Commit: `Define fresh MVP contract`

### Phase 1: One Server And Four Paths

- T004 | Version: v0.1.0 | Status: completed | Goal: Add minimal server package with health under `/api/health`. | Verify: automated health test and manual API request. | Commit: `Add API server shell`
- T005 | Version: v0.1.1 | Status: completed | Goal: Serve `/doc`, `/readme`, `/adminui`, and `/api` from the same server. | Verify: Browser Use path check and API request. | Commit: `Add four MVP paths`
- T006 | Version: v0.1.2 | Status: completed | Goal: Add `/doc` and `/readme` pages that explain current completed features in English+Hinglish. | Verify: Browser Use doc/readme check. | Commit: `Add MVP docs pages`
- T007 | Version: v0.1.3 | Status: completed | Goal: Add minimal Admin UI shell with navigation for Dashboard, Schemas, APIs, Roles, Users, Docs. | Verify: Browser Use admin nav check. | Commit: `Add MVP admin shell`
- T008 | Version: v0.1.4 | Status: completed | Goal: Release base path checkpoint. | Verify: standard verification and Browser Use all four paths. | Commit: `Release base paths`

### Phase 2: Owner Bootstrap And Login

- T009 | Version: v0.2.0 | Status: completed | Goal: Add SQLite foundation, migrations, and tables for users, roles, schemas, fields, entries, permissions. | Verify: migration tests. | Commit: `Add MVP database foundation`
- T010 | Version: v0.2.1 | Status: completed | Goal: Add first-time owner bootstrap so first login creates or activates owner. | Verify: owner bootstrap API test and manual request. | Commit: `Add owner bootstrap`
- T011 | Version: v0.2.2 | Status: completed | Goal: Add Admin UI login/logout for owner. | Verify: Browser Use owner login flow. | Commit: `Add owner login UI`
- T012 | Version: v0.2.3 | Status: completed | Goal: Document owner bootstrap and login in `/doc` and `/readme`. | Verify: Browser Use docs check. | Commit: `Document owner login`
- T013 | Version: v0.2.4 | Status: completed | Goal: Release owner login checkpoint. | Verify: standard verification plus Browser Use login. | Commit: `Release owner bootstrap`

### Phase 3: Schema Builder And Relations

- T014 | Version: v0.3.0 | Status: completed | Goal: Add schema and field repositories with relation-aware field model. | Verify: repository tests. | Commit: `Add schema repositories`
- T015 | Version: v0.3.1 | Status: completed | Goal: Add schema admin APIs for create/list/read/update/delete with field validation. | Verify: API tests and manual request. | Commit: `Add schema APIs`
- T016 | Version: v0.3.2 | Status: completed | Goal: Add Admin UI schema form with text, long text, number, boolean, date, JSON, media, and relation fields. | Verify: Browser Use schema create flow. | Commit: `Add schema builder UI`
- T017 | Version: v0.3.3 | Status: completed | Goal: Add relation picker/validation so fields can reference another schema safely. | Verify: relation tests and Browser Use relation field flow. | Commit: `Add relation field support`
- T018 | Version: v0.3.4 | Status: pending | Goal: Document schema builder and relation rules in English+Hinglish. | Verify: Browser Use docs check. | Commit: `Document schema builder`
- T019 | Version: v0.3.5 | Status: pending | Goal: Release schema builder checkpoint. | Verify: standard verification and Browser Use schema flow. | Commit: `Release schema builder`

### Phase 4: Entries And Dynamic APIs

- T020 | Version: v0.4.0 | Status: pending | Goal: Add entries repository with schema-based validation. | Verify: entry repository tests. | Commit: `Add entry repository`
- T021 | Version: v0.4.1 | Status: pending | Goal: Add entry admin APIs for create/list/read/update/delete per schema. | Verify: API tests and manual request. | Commit: `Add entry admin APIs`
- T022 | Version: v0.4.2 | Status: pending | Goal: Add Admin UI entry forms generated from schema fields. | Verify: Browser Use entry create/edit flow. | Commit: `Add entry UI`
- T023 | Version: v0.4.3 | Status: pending | Goal: Add dynamic `/api/content/:schemaSlug` routes for list/read/create/update/delete. | Verify: dynamic API CRUD tests and manual request. | Commit: `Add dynamic content APIs`
- T024 | Version: v0.4.4 | Status: pending | Goal: Add Admin UI API list showing every generated dynamic API. | Verify: Browser Use API list check. | Commit: `Add dynamic API list UI`
- T025 | Version: v0.4.5 | Status: pending | Goal: Document dynamic API usage with examples in `/doc` and `/readme`. | Verify: Browser Use docs check. | Commit: `Document dynamic APIs`
- T026 | Version: v0.4.6 | Status: pending | Goal: Release dynamic API checkpoint. | Verify: create schema, entry, call dynamic API. | Commit: `Release dynamic APIs`

### Phase 5: Roles, Permissions, And Users

- T027 | Version: v0.5.0 | Status: pending | Goal: Add role repository and APIs to create unlimited roles. | Verify: role API tests and manual request. | Commit: `Add role APIs`
- T028 | Version: v0.5.1 | Status: pending | Goal: Add permission model for each dynamic API action: read, create, update, delete, manage. | Verify: permission evaluator tests. | Commit: `Add API permission model`
- T029 | Version: v0.5.2 | Status: pending | Goal: Add Admin UI role screen with dynamic API checklist and action checkboxes. | Verify: Browser Use role permission UI. | Commit: `Add role permission UI`
- T030 | Version: v0.5.3 | Status: pending | Goal: Enforce permissions on dynamic APIs with allow/block behavior. | Verify: allowed role succeeds, blocked role fails. | Commit: `Enforce dynamic API permissions`
- T031 | Version: v0.5.4 | Status: pending | Goal: Add user repository and APIs to create users and assign one role. | Verify: user API tests and manual request. | Commit: `Add user APIs`
- T032 | Version: v0.5.5 | Status: pending | Goal: Add Admin UI user create/list screen with role assignment. | Verify: Browser Use user create flow. | Commit: `Add user management UI`
- T033 | Version: v0.5.6 | Status: pending | Goal: Verify role/user/API flow end-to-end: create API, create role, assign permissions, create user, login user, check visible/blocked APIs. | Verify: automated e2e plus Browser Use. | Commit: `Verify MVP RBAC flow`
- T034 | Version: v0.5.7 | Status: pending | Goal: Document roles, permissions, users, allow/block examples in English+Hinglish. | Verify: Browser Use docs check. | Commit: `Document MVP RBAC`
- T035 | Version: v0.5.8 | Status: pending | Goal: Release MVP RBAC checkpoint. | Verify: standard verification and full manual flow. | Commit: `Release MVP RBAC`

### Phase 6: MVP Polish And Final Gate

- T036 | Version: v0.6.0 | Status: pending | Goal: Polish Admin UI empty states, success/errors, loading states, and responsive layout. | Verify: Browser Use desktop/mobile visual check. | Commit: `Polish MVP admin UI`
- T037 | Version: v0.6.1 | Status: pending | Goal: Add full MVP manual QA checklist for Browser Use and API requests. | Verify: checklist review. | Commit: `Add MVP QA checklist`
- T038 | Version: v0.6.2 | Status: pending | Goal: Add smoke test covering owner login, schema, entry, dynamic API, role, user permission. | Verify: `npm run smoke`. | Commit: `Add MVP smoke test`
- T039 | Version: v0.6.3 | Status: pending | Goal: Final docs/readme sync for every completed MVP feature. | Verify: Browser Use `/doc` and `/readme`. | Commit: `Sync MVP docs`
- T040 | Version: v1.0.0 | Status: pending | Goal: Final MVP release gate. | Verify: standard verification, smoke, Browser Use full flow, manual API flow. | Commit: `Release Apiagex MVP`
