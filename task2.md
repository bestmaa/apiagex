# Apiagex Task 2 Queue

This queue starts after the MVP v0 task list. It pauses direct execution of the old docs/readme final gate and rewrites the next work in a clearer format.

Ye queue MVP v0 ke baad ka next kaam hai. Old `tasks.md` se remaining docs/readme/release work yahan move kiya gaya hai, aur Admin UI ko better routed product banane ka plan yahan se chalega.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep product docs in English + Hinglish where user-facing.
- Browser-facing Admin UI tasks must be verified on desktop and mobile.
- Do not break existing smoke flow: `npm run smoke` must keep passing.
- To save context, first scan only task headings and `Status` lines, then read the full details only for the first pending task.
- Do not read completed task bodies unless they are needed to debug or understand a dependency.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## GPT-5.5 Low-Token Prompt

```text
Apiagex task2 runner.
Read agent.md, PROJECT_CONTEXT.md, tasks.md, task2.md. Pick first task2 `Status: pending` only.
To save context, scan task headings/status first, then read only the first pending task details.
Before code: mark task in_progress. After verified: mark completed and commit exact message.
Keep one server: /api /adminui /doc /readme. Do not break npm run smoke.
Strict TS, files <250 lines, shared types in *.type.ts, no future-task behavior.
Admin UI tasks: routed control panel, practical SaaS UI, no marketing hero/cards-inside-cards, verify desktop+mobile browser.
Docs tasks: English+Hinglish, preserve /doc and /readme. Static docs/VitePress only when task says.
Backend tasks: automated tests + manual/API check. RBAC tasks: verify allowed and blocked role/user flow.
Run npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
```

## Task Format

Each task uses this structure:

- Version
- Status
- Goal
- Persona
- Success Criteria
- Constraints
- Output
- Strict Rule
- Verify
- Commit

## Queue

### Phase 1: Close MVP V0 Documentation Cleanly

#### T201 - Sync Current MVP Docs

- Version: `v0.6.3`
- Status: `completed`
- Goal: Sync `/doc`, `/readme`, root `README.md`, and `PROJECT_CONTEXT.md` with every completed MVP v0 feature.
- Persona: Clear product explainer; write so a beginner can understand owner, schema, entry, API, role, user, and permission flow.
- Success Criteria: `/doc` and `/readme` mention owner bootstrap/login, schema fields, relation rules, entries, dynamic APIs, roles, users, allow/block behavior, smoke test, and QA checklist.
- Constraints: Keep current inline server-rendered docs for this task; do not migrate to VitePress yet.
- Output: Updated docs/readme content in English + Hinglish.
- Strict Rule: Do not change product behavior or Admin UI in this task.
- Verify: Browser check `/doc` and `/readme`; run standard verification.
- Commit: `Sync MVP docs`

#### T202 - Release MVP V0 Gate

- Version: `v1.0.0`
- Status: `completed`
- Goal: Run final MVP v0 release gate and document the release state.
- Persona: Release engineer; verify before claiming release readiness.
- Success Criteria: Standard verification passes, smoke passes, browser checks cover `/adminui`, `/doc`, `/readme`, and manual API flow covers owner/schema/entry/content/RBAC.
- Constraints: No new features; only release notes/checkpoint updates if needed.
- Output: Release checkpoint notes in README/PROJECT_CONTEXT if needed.
- Strict Rule: If any verification fails, fix only the failure needed for the release gate.
- Verify: Standard verification plus manual API flow and browser checks.
- Commit: `Release Apiagex MVP`

### Phase 2: Admin UI Routing And Page Structure

#### T203 - Add Real Admin UI Routing

- Version: `v1.1.0`
- Status: `completed`
- Goal: Convert Admin UI from one long page into a routed app with stable pages for Dashboard, Schemas, Entries, APIs, Roles, Users, and Docs.
- Persona: Product UI engineer; build a control panel that feels organized, not like a demo page.
- Success Criteria: Navigation changes visible page content without full reload; active route is highlighted; direct URLs or hash routes work after refresh under `/adminui`.
- Constraints: Keep one server and preserve `/adminui`; use lightweight React routing or a local route state pattern, not a large framework migration.
- Output: Route-aware Admin UI shell and page components.
- Strict Rule: Do not change backend APIs in this task.
- Verify: Browser desktop/mobile route navigation; run standard verification.
- Commit: `Add admin UI routing`

#### T204 - Build Dashboard Page

- Version: `v1.1.1`
- Status: `pending`
- Goal: Create a useful Dashboard page with counts, recent schemas, generated API summary, and quick actions.
- Persona: Owner/admin operator; show what needs attention at a glance.
- Success Criteria: Dashboard shows schema count, role count, user count, API count, empty states, and quick links to create schema/role/user.
- Constraints: Use existing APIs only; do not add analytics tables.
- Output: Dashboard page component with loading, empty, success, and error states.
- Strict Rule: Do not put decorative marketing sections in the app.
- Verify: Browser check with empty state and after creating sample schema/role/user; run standard verification.
- Commit: `Build admin dashboard`

#### T205 - Rework Schemas Page

- Version: `v1.1.2`
- Status: `pending`
- Goal: Make Schemas a full page with schema list, create/edit form, field builder, relation picker, and selected schema details.
- Persona: CMS builder; make schema creation understandable and repeatable.
- Success Criteria: Owner can create schema, add fields, see field list, select existing schema, edit schema basics, and understand validation errors.
- Constraints: Keep field types text, long text, number, boolean, date, JSON, media, relation; no drag-and-drop until a later task.
- Output: Schema page split into focused components.
- Strict Rule: Relation fields must still require an existing schema target.
- Verify: Browser schema create/edit/relation flow; existing schema tests and standard verification.
- Commit: `Rework schema page`

#### T206 - Rework Entries Page

- Version: `v1.1.3`
- Status: `pending`
- Goal: Make Entries a dedicated page where owner selects schema, creates entries, lists entries, and edits/deletes entries.
- Persona: Content editor; make day-to-day content work simple.
- Success Criteria: Entry form is generated from schema fields, validates required/type errors, lists existing entries, and supports edit/delete.
- Constraints: Use current entry APIs; do not add publishing workflow yet.
- Output: Entries page with schema selector, form, table/list, and status messages.
- Strict Rule: JSON/media/relation fields must not silently save invalid values.
- Verify: Browser create/list/edit/delete entry flow; run standard verification.
- Commit: `Rework entries page`

#### T207 - Build Generated API Explorer Page

- Version: `v1.1.4`
- Status: `pending`
- Goal: Replace simple API list with an API Explorer page showing generated endpoints, actions, sample payloads, and copyable examples.
- Persona: Developer using generated APIs; make the API contract easy to inspect.
- Success Criteria: For each schema, show list/read/create/update/delete endpoints, payload shape, headers for role permission testing, and response examples.
- Constraints: Examples can be static/generated from schema metadata; do not build a full Swagger system yet.
- Output: API Explorer page.
- Strict Rule: Endpoint examples must match actual server routes.
- Verify: Browser check API explorer after creating schema; smoke still passes.
- Commit: `Build generated API explorer`

#### T208 - Rework Roles And Permissions Page

- Version: `v1.1.5`
- Status: `pending`
- Goal: Make Roles a dedicated page for creating roles and managing per-schema read/create/update/delete/manage permissions.
- Persona: Access-control admin; make allow/block behavior visible and hard to misunderstand.
- Success Criteria: Role list, role creation, schema permission matrix, save status, and clear unchecked-means-blocked behavior.
- Constraints: Preserve current RBAC semantics: owner bypass, manage allows all, unchecked blocks when role header is used.
- Output: Roles page with permission matrix.
- Strict Rule: Permission UI must not imply public access is blocked when no role header is sent; explain actual behavior in UI copy only where needed.
- Verify: Browser role permission flow plus automated RBAC/smoke tests.
- Commit: `Rework role permissions page`

#### T209 - Rework Users Page

- Version: `v1.1.6`
- Status: `pending`
- Goal: Make Users a dedicated page for creating users, assigning one role, listing users, and checking assigned access.
- Persona: Admin managing team access; keep user-role mapping obvious.
- Success Criteria: User form validates email/password/role, user list shows role, empty/loading/error states work, and role dropdown uses live roles.
- Constraints: MVP still supports exactly one role per user.
- Output: Users page with create/list flow.
- Strict Rule: Never display password hashes in UI.
- Verify: Browser user create flow; user API tests and standard verification.
- Commit: `Rework user management page`

#### T210 - Improve Auth And Session UX

- Version: `v1.1.7`
- Status: `pending`
- Goal: Improve owner login/bootstrap/session handling in Admin UI.
- Persona: First-time owner; make setup/login states clear.
- Success Criteria: UI supports first owner bootstrap when needed, owner login, logout, persisted session display, failed login errors, and session reset.
- Constraints: Do not introduce JWT/session security claims beyond current backend behavior unless a backend task explicitly adds them.
- Output: Auth UI and session state cleanup.
- Strict Rule: UI labels must not claim production-grade auth until backend implements it.
- Verify: Browser first-time bootstrap/login/logout flow; owner auth tests and standard verification.
- Commit: `Improve admin auth UX`

#### T211 - Add Admin UI Interaction Polish

- Version: `v1.1.8`
- Status: `pending`
- Goal: Add consistent loading states, success/error banners, disabled submit states, empty states, and responsive layout across Admin UI pages.
- Persona: Practical SaaS UI designer; make repeated admin work calm and predictable.
- Success Criteria: Every form has pending/success/error states, long labels fit on mobile, navigation stays usable, and page sections do not overlap.
- Constraints: Use existing CSS/React stack; no component library unless approved in a task.
- Output: Shared UI helpers/components and CSS polish.
- Strict Rule: Do not add decorative blobs, marketing hero sections, or card-inside-card layouts.
- Verify: Browser screenshots desktop/mobile for all admin pages; run standard verification.
- Commit: `Polish routed admin UI`

### Phase 3: Docs Architecture And Product Packaging

#### T212 - Plan Static Docs Architecture

- Version: `v1.2.0`
- Status: `pending`
- Goal: Decide and document how `/doc` and `/readme` should move from inline server HTML to static built docs.
- Persona: System architect; keep URLs stable while improving maintainability.
- Success Criteria: Architecture note explains VitePress/static-docs option, package location, build output, server static serving, and migration steps.
- Constraints: Planning only; no implementation in this task.
- Output: Docs architecture section in `PROJECT_CONTEXT.md` or `docs/README.md`.
- Strict Rule: Preserve `/doc` and `/readme` public paths.
- Verify: Documentation review and standard verification.
- Commit: `Plan docs architecture`

#### T213 - Implement Static Docs Package

- Version: `v1.2.1`
- Status: `pending`
- Goal: Add a docs package that builds `/doc` and `/readme` content as static assets served by the API server.
- Persona: Documentation platform engineer; separate content from server code.
- Success Criteria: Docs build command exists, server serves built docs, `/doc` and `/readme` still work, and missing-build fallback is clear.
- Constraints: Use VitePress or a similarly simple static docs approach; do not break Admin UI serving.
- Output: `packages/docs` or equivalent static docs package plus server static resolver.
- Strict Rule: Do not remove English + Hinglish content.
- Verify: Browser `/doc` and `/readme`; standard verification.
- Commit: `Add static docs package`

#### T214 - Make create-apiagex CLI Useful

- Version: `v1.3.0`
- Status: `pending`
- Goal: Replace the placeholder `create-apiagex` package with a real installer/scaffold CLI plan or minimal implementation.
- Persona: Package author; make new project creation predictable.
- Success Criteria: CLI can at least print help, validate target folder, and explain/install scaffold steps; tests cover basic CLI behavior.
- Constraints: Do not publish package in this task.
- Output: CLI entrypoint, README update, and tests.
- Strict Rule: Do not overwrite an existing user folder without explicit confirmation.
- Verify: CLI test, local command run, standard verification.
- Commit: `Build create-apiagex CLI`

#### T215 - Add Local Persistence Configuration

- Version: `v1.3.1`
- Status: `pending`
- Goal: Add clear local database path and upload path configuration for development.
- Persona: Local developer; make data persistence understandable.
- Success Criteria: Server can run with documented local SQLite path, uploads directory is documented, and tests still use in-memory database.
- Constraints: Do not require external services.
- Output: Config docs and minimal server config updates.
- Strict Rule: Tests must remain isolated and not write to production/local data by default.
- Verify: Manual local run, tests, smoke, audit, diff check.
- Commit: `Add local persistence config`

### Phase 4: Final Task 2 Gate

#### T216 - Task 2 Release Gate

- Version: `v2.0.0`
- Status: `pending`
- Goal: Final verification for routed Admin UI, synced docs, smoke flow, and package health.
- Persona: Release engineer; only release what is verified.
- Success Criteria: All task2 features are documented, Admin UI browser checks pass on desktop/mobile, docs paths work, API smoke passes, and standard verification is clean.
- Constraints: No new feature work unless required to fix release blockers.
- Output: Release checkpoint update.
- Strict Rule: Do not mark complete with skipped browser checks unless the user explicitly accepts the risk.
- Verify: Standard verification, Browser checks for `/adminui`, `/doc`, `/readme`, manual API/RBAC flow.
- Commit: `Release Apiagex task 2`
