# Apiagex Task Queue
This queue is the working contract for moving Apiagex forward in small verified version steps. Pick the first task with `Status: pending`, mark it `in_progress`, finish it, verify it, update docs/context, commit it, then start the next task automatically.
Ye queue Apiagex ko chhote verified version steps me aage badhane ka contract hai. Pehla `Status: pending` task lo, use `in_progress` mark karo, finish karo, verify karo, docs/context update karo, commit karo, phir next task auto start karo.
## Operating Rules
- Work on exactly one task at a time.
- Pick the first task with `Status: pending`.
- Change its status to `in_progress` before editing code.
- Auto mode is enabled: after one task is implemented, verified, versioned, documented, and committed, start the next pending task automatically.
- Do not start the next task until the current task is implemented, verified, versioned, documented, and committed.
- If verification fails, keep the same task `in_progress` and fix it before moving on.
- Stop auto mode only when verification fails, a blocker appears, Browser Use checks cannot run, Git fails, npm workflow fails, database reset is risky, or the user says stop/pause/review.
- Keep changes scoped to the current task and preserve user changes.
- Keep every source, docs, test, script, plugin, and skill file below 250 lines. Split before crossing 250 lines.
- Keep code clean, modular, readable, and TypeScript strict. Avoid `any`; if unavoidable, document why.
- Keep types in matching `*.type.ts` files. Do not mix large type contracts into implementation files.
- Update English and Hinglish docs for every user-facing/module behavior change.
- Update `PROJECT_CONTEXT.md` after every completed task that changes project direction, structure, commands, or implemented status.
- Add or update tests for every behavior change.
- Use Browser Use for every user-facing version check. Open the admin/docs route and verify visible UI, console errors, forms, navigation, and language toggle when relevant.
- Test APIs after every backend change with automated tests and at least one manual request flow.
- Use one runtime server for local development: API, docs, README, uploads, and Admin UI must be served from the same API host/port.
- Do not start a separate Admin UI server unless a task explicitly targets package-level admin dev-server compatibility.
- After every completed code task, bump package versions to the task version listed below.
- After every completed task, commit with the listed commit message.
- Do not push after every task. Push only at phase release tasks or when the user explicitly asks.
- Owner test credentials are development-only: `owner@apiagex.local` and `OwnerPass123!`. Do not ship real secrets.
- Do not delete SQLite data unless the active task requires a reset. Before reset, stop servers, remove only known local dev DB/uploads paths, then recreate through migrations.

## Standard Verification
Run these checks for every code task unless the task explicitly says docs-only:

```powershell
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm run check"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm run smoke"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm audit --audit-level=high"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && git diff --check"
```

Manual Browser Use verification is required before marking a user-facing task complete:
```text
Open http://127.0.0.1:4000/docs/ and http://127.0.0.1:4000/adminui/.
Log in with the active dev owner account.
Verify the changed screen, forms, role visibility, API calls, console errors, docs language toggle, and any new route.
For backend APIs, create a matching manual request flow and confirm status/body.
```

## Phase Release Verification
For phase release tasks, do all standard checks, then:

```powershell
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm run release:check"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && git status --short && git log -1 --oneline"
```

Then verify: GitHub workflow if remote CI exists, starter install, `/docs/`, `/adminui/` login plus one dynamic API CRUD flow, and public API read after publish.

## GPT-5.5 Low-Token Prompt
```text
Apiagex task runner.
Read agent.md, PROJECT_CONTEXT.md, and tasks.md. Pick first `Status: pending`.
Set it `in_progress`. Implement only that task.
Rules: clean strict TS, no any unless documented, files <250 lines, matching *.type.ts, docs in English+Hinglish, tests for behavior changes.
If user-facing: verify with Browser Use on /docs/ and /adminui/ and test API manually.
Verify: npm run check + npm run smoke + npm audit --audit-level=high + git diff --check.
Bump package versions to task Version when code changes.
Set task `completed`. Update PROJECT_CONTEXT.md. Commit with task Commit message.
Continue next pending task automatically unless blocked/failing/user stops.
Push only on phase release tasks or explicit user request.
```

## Task Format

`Task ID | Version | Status | Goal | Verify | Commit`

## Queue

### Phase 1: Worktree, Dev Reset, And Owner Bootstrap

- T001 | Version: v0.2.0 | Status: completed | Goal: Initialize/repair Git workflow for the repo without losing user files; document branch and commit rules. | Verify: `git status`, docs-only review. | Commit: `Document Apiagex task workflow`
- T002 | Version: v0.2.1 | Status: completed | Goal: Add safe local reset script for SQLite dev DB/uploads with explicit known paths only. | Verify: reset script test dry-run. | Commit: `Add safe dev reset workflow`
- T003 | Version: v0.2.2 | Status: completed | Goal: Add dev owner seed config using `owner@apiagex.local` and `OwnerPass123!` for local reset only. | Verify: login API test. | Commit: `Seed local owner account`
- T004 | Version: v0.2.3 | Status: completed | Goal: Add docs for local DB reset, owner login, and recovery in English/Hinglish. | Verify: docs browser check. | Commit: `Document local owner reset`
- T005 | Version: v0.2.4 | Status: completed | Goal: Add reset smoke that deletes/recreates local SQLite DB and verifies owner login. | Verify: focused reset smoke. | Commit: `Test local reset smoke`
- T006 | Version: v0.2.5 | Status: completed | Goal: Phase 1 release check. | Verify: phase release verification. | Commit: `Release dev reset phase`

### Infrastructure Adjustment: Single-Server Admin UI

- T007A | Version: v0.3.0 | Status: completed | Goal: Serve Admin UI, docs, README, uploads, and Admin UI API aliases from the API server so local users only start one server. | Verify: server tests, standard verification, Browser Use admin login at `/adminui/`. | Commit: `Serve admin UI from API server`

### Phase 2: RBAC V2 Permission Core

- T007 | Version: v0.3.0 | Status: completed | Goal: Design canonical permission scope grammar for system, tenant, content, media, webhook, backup, and raw API routes. | Verify: design docs. | Commit: `Design permission scope grammar`
- T008 | Version: v0.3.1 | Status: completed | Goal: Add permission action constants for `read`, `create`, `update`, `delete`, `execute`, and `manage`. | Verify: type tests. | Commit: `Add permission action constants`
- T009 | Version: v0.3.2 | Status: completed | Goal: Add permission evaluator service with owner bypass and default-deny behavior. | Verify: evaluator unit tests. | Commit: `Add permission evaluator`
- T010 | Version: v0.3.3 | Status: completed | Goal: Add deny precedence so explicit `false` blocks fallback allows. | Verify: deny precedence tests. | Commit: `Add explicit deny precedence`
- T011 | Version: v0.3.4 | Status: completed | Goal: Migrate existing role catalog permissions through the new evaluator without breaking current tests. | Verify: role and entry permission tests. | Commit: `Migrate roles to permission evaluator`
- T012 | Version: v0.3.5 | Status: completed | Goal: Add route permission metadata helper for Fastify routes. | Verify: route guard tests. | Commit: `Add route permission metadata`
- T013 | Version: v0.3.6 | Status: pending | Goal: Guard roles routes with `system:roles` permissions. | Verify: roles API tests. | Commit: `Guard role APIs with permissions`
- T014 | Version: v0.3.7 | Status: pending | Goal: Guard audit, backup, migrations, webhooks, media, search, and realtime admin routes through the evaluator. | Verify: route matrix tests. | Commit: `Guard admin APIs with permissions`
- T015 | Version: v0.3.8 | Status: pending | Goal: Add public API authenticated allow/block tests for content-type list/read. | Verify: public permission tests. | Commit: `Test public API permissions`
- T016 | Version: v0.3.9 | Status: pending | Goal: Document RBAC V2 scopes and examples in English/Hinglish. | Verify: docs browser check. | Commit: `Document RBAC V2`
- T017 | Version: v0.3.10 | Status: pending | Goal: Phase 2 release check. | Verify: phase release verification. | Commit: `Release RBAC core phase`

### Phase 3: Admin Permission Matrix

- T018 | Version: v0.4.0 | Status: pending | Goal: Split admin UI modules so all source files stay under 250 lines before adding role UI. | Verify: line-count check and admin tests. | Commit: `Split admin UI modules`
- T019 | Version: v0.4.1 | Status: pending | Goal: Add roles page route and navigation visibility for owner/admin. | Verify: Browser Use role nav check. | Commit: `Add roles admin page`
- T020 | Version: v0.4.2 | Status: pending | Goal: Add role list/create/edit/delete forms. | Verify: Browser Use CRUD and route tests. | Commit: `Add role management UI`
- T021 | Version: v0.4.3 | Status: pending | Goal: Add permission matrix component for system scopes. | Verify: UI test and browser check. | Commit: `Add system permission matrix`
- T022 | Version: v0.4.4 | Status: pending | Goal: Add permission matrix component for every content type. | Verify: content API allow/block browser flow. | Commit: `Add content permission matrix`
- T023 | Version: v0.4.5 | Status: pending | Goal: Add route/API permission rows for webhooks, backups, media, search, realtime, audit, and migrations. | Verify: matrix save tests. | Commit: `Add API permission rows`
- T024 | Version: v0.4.6 | Status: pending | Goal: Add dirty-state and validation UX for permission edits. | Verify: Browser Use form check. | Commit: `Improve permission editing UX`
- T025 | Version: v0.4.7 | Status: pending | Goal: Add docs and screenshots checklist for permission matrix. | Verify: docs browser check. | Commit: `Document permission matrix UI`
- T026 | Version: v0.4.8 | Status: pending | Goal: Phase 3 release check. | Verify: phase release verification. | Commit: `Release permission matrix phase`

### Phase 4: Tenant Foundation

- T027 | Version: v0.5.0 | Status: pending | Goal: Design tenant model, tenant resolver order, and isolation contract. | Verify: design docs. | Commit: `Design tenant foundation`
- T028 | Version: v0.5.1 | Status: pending | Goal: Add tenant types and repository with SQLite schema. | Verify: repository tests. | Commit: `Add tenant repository`
- T029 | Version: v0.5.2 | Status: pending | Goal: Seed default tenant for existing single-tenant installs. | Verify: migration tests. | Commit: `Seed default tenant`
- T030 | Version: v0.5.3 | Status: pending | Goal: Add tenant resolver from header, path, and configured single-tenant fallback. | Verify: resolver tests. | Commit: `Add tenant resolver`
- T031 | Version: v0.5.4 | Status: pending | Goal: Attach tenant context to requests and audit logs. | Verify: audit tenant tests. | Commit: `Attach tenant context`
- T032 | Version: v0.5.5 | Status: pending | Goal: Add tenant admin routes for list/create/update/deactivate. | Verify: route tests and API manual flow. | Commit: `Add tenant admin APIs`
- T033 | Version: v0.5.6 | Status: pending | Goal: Add English/Hinglish tenant foundation docs. | Verify: docs browser check. | Commit: `Document tenant foundation`
- T034 | Version: v0.5.7 | Status: pending | Goal: Phase 4 release check. | Verify: phase release verification. | Commit: `Release tenant foundation phase`

### Phase 5: Tenant Data Isolation

- T035 | Version: v0.6.0 | Status: pending | Goal: Add `tenant_id` to content types and migrate old records to default tenant. | Verify: migration tests. | Commit: `Scope content types by tenant`
- T036 | Version: v0.6.1 | Status: pending | Goal: Scope content fields by tenant through content type ownership. | Verify: cross-tenant field tests. | Commit: `Scope content fields by tenant`
- T037 | Version: v0.6.2 | Status: pending | Goal: Scope entries by tenant and block cross-tenant reads/writes. | Verify: isolation tests. | Commit: `Scope entries by tenant`
- T038 | Version: v0.6.3 | Status: pending | Goal: Scope media files and uploads by tenant. | Verify: media isolation tests. | Commit: `Scope media by tenant`
- T039 | Version: v0.6.4 | Status: pending | Goal: Scope webhooks and delivery history by tenant. | Verify: webhook tenant tests. | Commit: `Scope webhooks by tenant`
- T040 | Version: v0.6.5 | Status: pending | Goal: Scope roles by tenant with global built-in templates. | Verify: tenant role tests. | Commit: `Scope roles by tenant`
- T041 | Version: v0.6.6 | Status: pending | Goal: Scope backups, restores, and migrations by tenant. | Verify: backup isolation tests. | Commit: `Scope backups by tenant`
- T042 | Version: v0.6.7 | Status: pending | Goal: Add tenant isolation manual checklist. | Verify: Browser Use two-tenant flow. | Commit: `Document tenant isolation checks`
- T043 | Version: v0.6.8 | Status: pending | Goal: Phase 5 release check. | Verify: phase release verification. | Commit: `Release tenant isolation phase`

### Phase 6: Tenant-Aware Admin UI

- T044 | Version: v0.7.0 | Status: pending | Goal: Add tenant switcher UI for owner/admin. | Verify: Browser Use switcher check. | Commit: `Add tenant switcher`
- T045 | Version: v0.7.1 | Status: pending | Goal: Add tenant CRUD screen. | Verify: Browser Use tenant CRUD. | Commit: `Add tenant management UI`
- T046 | Version: v0.7.2 | Status: pending | Goal: Show active tenant in schema, entries, media, webhooks, audit, and settings panels. | Verify: UI route tests. | Commit: `Show active tenant context`
- T047 | Version: v0.7.3 | Status: pending | Goal: Add tenant-aware API client header/path handling in admin UI. | Verify: API request tests. | Commit: `Send tenant context from admin`
- T048 | Version: v0.7.4 | Status: pending | Goal: Add cross-tenant browser smoke with two tenants and one duplicated API name. | Verify: Browser Use flow. | Commit: `Test tenant admin flow`
- T049 | Version: v0.7.5 | Status: pending | Goal: Document tenant admin UX in English/Hinglish. | Verify: docs browser check. | Commit: `Document tenant admin UI`
- T050 | Version: v0.7.6 | Status: pending | Goal: Phase 6 release check. | Verify: phase release verification. | Commit: `Release tenant admin phase`

### Phase 7: API Templates And Sharing

- T051 | Version: v0.8.0 | Status: pending | Goal: Design shared API template model for multi-tenant reuse. | Verify: design docs. | Commit: `Design API templates`
- T052 | Version: v0.8.1 | Status: pending | Goal: Add template repository and schema. | Verify: repository tests. | Commit: `Add API template repository`
- T053 | Version: v0.8.2 | Status: pending | Goal: Add content type export-to-template route. | Verify: route tests. | Commit: `Export content type templates`
- T054 | Version: v0.8.3 | Status: pending | Goal: Add template import route into tenant schema. | Verify: import tests. | Commit: `Import API templates`
- T055 | Version: v0.8.4 | Status: pending | Goal: Add template versioning and compatibility validation. | Verify: validation tests. | Commit: `Version API templates`
- T056 | Version: v0.8.5 | Status: pending | Goal: Add admin UI for template export/import. | Verify: Browser Use template flow. | Commit: `Add template admin UI`
- T057 | Version: v0.8.6 | Status: pending | Goal: Document template sharing in English/Hinglish. | Verify: docs browser check. | Commit: `Document API templates`
- T058 | Version: v0.8.7 | Status: pending | Goal: Phase 7 release check. | Verify: phase release verification. | Commit: `Release API templates phase`

### Phase 8: User And Membership Management

- T059 | Version: v0.9.0 | Status: pending | Goal: Design users, identities, tenant memberships, and account lifecycle. | Verify: design docs. | Commit: `Design user memberships`
- T060 | Version: v0.9.1 | Status: pending | Goal: Add users repository with password hashing boundary. | Verify: auth tests. | Commit: `Add users repository`
- T061 | Version: v0.9.2 | Status: pending | Goal: Add tenant membership repository. | Verify: membership tests. | Commit: `Add tenant memberships`
- T062 | Version: v0.9.3 | Status: pending | Goal: Change login to resolve user memberships and active tenant role. | Verify: auth route tests. | Commit: `Resolve tenant role on login`
- T063 | Version: v0.9.4 | Status: pending | Goal: Add invitation/create-user admin APIs. | Verify: API tests. | Commit: `Add user admin APIs`
- T064 | Version: v0.9.5 | Status: pending | Goal: Add admin UI for users and tenant memberships. | Verify: Browser Use user flow. | Commit: `Add user management UI`
- T065 | Version: v0.9.6 | Status: pending | Goal: Document user and membership model in English/Hinglish. | Verify: docs browser check. | Commit: `Document user memberships`
- T066 | Version: v0.9.7 | Status: pending | Goal: Phase 8 release check. | Verify: phase release verification. | Commit: `Release user membership phase`

### Phase 9: Database Adapter Hardening

- T067 | Version: v0.10.0 | Status: pending | Goal: Audit database adapter contracts and replace placeholders with actionable interfaces. | Verify: adapter tests. | Commit: `Harden database contracts`
- T068 | Version: v0.10.1 | Status: pending | Goal: Move SQLite repositories behind adapter factory boundaries. | Verify: existing tests pass. | Commit: `Introduce repository adapter factory`
- T069 | Version: v0.10.2 | Status: pending | Goal: Add PostgreSQL schema/migration design without enabling production driver yet. | Verify: design docs. | Commit: `Design PostgreSQL adapter`
- T070 | Version: v0.10.3 | Status: pending | Goal: Add MySQL schema/migration design without enabling production driver yet. | Verify: design docs. | Commit: `Design MySQL adapter`
- T071 | Version: v0.10.4 | Status: pending | Goal: Add adapter selection validation in installer and server config. | Verify: config tests. | Commit: `Validate database adapter selection`
- T072 | Version: v0.10.5 | Status: pending | Goal: Document database adapter roadmap in English/Hinglish. | Verify: docs browser check. | Commit: `Document database adapter roadmap`
- T073 | Version: v0.10.6 | Status: pending | Goal: Phase 9 release check. | Verify: phase release verification. | Commit: `Release database hardening phase`

### Phase 10: Storage, Security, And Production Hardening

- T074 | Version: v0.11.0 | Status: pending | Goal: Implement MinIO storage adapter behind existing storage interface. | Verify: adapter tests. | Commit: `Add MinIO storage adapter`
- T075 | Version: v0.11.1 | Status: pending | Goal: Implement S3 storage adapter behind existing storage interface. | Verify: mocked adapter tests. | Commit: `Add S3 storage adapter`
- T076 | Version: v0.11.2 | Status: pending | Goal: Add rate limiting for auth and sensitive admin APIs. | Verify: rate limit tests. | Commit: `Add sensitive API rate limits`
- T077 | Version: v0.11.3 | Status: pending | Goal: Add API keys for public API consumers with scoped permissions. | Verify: API key tests. | Commit: `Add scoped API keys`
- T078 | Version: v0.11.4 | Status: pending | Goal: Add CORS and trusted origin production validation. | Verify: config tests. | Commit: `Validate trusted origins`
- T079 | Version: v0.11.5 | Status: pending | Goal: Add security docs for auth, roles, tenants, API keys, CORS, backups, and storage. | Verify: docs browser check. | Commit: `Document production security`
- T080 | Version: v0.11.6 | Status: pending | Goal: Phase 10 release check. | Verify: phase release verification. | Commit: `Release production hardening phase`

### Phase 11: Observability And Operations

- T081 | Version: v0.12.0 | Status: pending | Goal: Add structured audit event IDs and correlation with request IDs. | Verify: audit tests. | Commit: `Correlate audit and request IDs`
- T082 | Version: v0.12.1 | Status: pending | Goal: Add metrics snapshot route for cache, scheduler, webhooks, storage, tenants, and DB. | Verify: metrics tests. | Commit: `Add operations metrics`
- T083 | Version: v0.12.2 | Status: pending | Goal: Add admin ops panels for metrics and tenant health. | Verify: Browser Use ops flow. | Commit: `Add tenant ops panels`
- T084 | Version: v0.12.3 | Status: pending | Goal: Add webhook dead-letter inspection and retry controls. | Verify: webhook tests and browser flow. | Commit: `Add webhook dead letter controls`
- T085 | Version: v0.12.4 | Status: pending | Goal: Add backup integrity checks and restore preview. | Verify: backup tests. | Commit: `Add backup integrity preview`
- T086 | Version: v0.12.5 | Status: pending | Goal: Document operations runbook in English/Hinglish. | Verify: docs browser check. | Commit: `Document operations runbook`
- T087 | Version: v0.12.6 | Status: pending | Goal: Phase 11 release check. | Verify: phase release verification. | Commit: `Release operations phase`

### Phase 12: Installer And Generated Starter

- T088 | Version: v0.13.0 | Status: pending | Goal: Add installer prompts for tenant mode, DB adapter, storage driver, and owner credentials. | Verify: installer tests. | Commit: `Add installer production prompts`
- T089 | Version: v0.13.1 | Status: pending | Goal: Generate starter with tenant-aware env examples and safe secret placeholders. | Verify: generated app smoke. | Commit: `Generate tenant aware starter`
- T090 | Version: v0.13.2 | Status: pending | Goal: Add generated starter docs for first login and first API creation. | Verify: generated docs browser check. | Commit: `Document starter first run`
- T091 | Version: v0.13.3 | Status: pending | Goal: Add generated starter release smoke for reset, login, create API, publish, public read, backup, restore. | Verify: release smoke. | Commit: `Expand starter release smoke`
- T092 | Version: v0.13.4 | Status: pending | Goal: Add installer rollback on failed scaffold writes. | Verify: installer failure tests. | Commit: `Add installer rollback`
- T093 | Version: v0.13.5 | Status: pending | Goal: Phase 12 release check. | Verify: phase release verification. | Commit: `Release installer hardening phase`

### Phase 13: Docs, Manual QA, And Examples

- T094 | Version: v0.14.0 | Status: pending | Goal: Rebuild docs navigation into product paths: install, admin, RBAC, tenants, APIs, production, operations. | Verify: docs browser check. | Commit: `Group Apiagex docs paths`
- T095 | Version: v0.14.1 | Status: pending | Goal: Add complete English/Hinglish RBAC tutorial with allow/block examples. | Verify: docs browser check. | Commit: `Add RBAC tutorial`
- T096 | Version: v0.14.2 | Status: pending | Goal: Add complete English/Hinglish multi-tenant tutorial. | Verify: docs browser check. | Commit: `Add multi tenant tutorial`
- T097 | Version: v0.14.3 | Status: pending | Goal: Add public API consumer examples for list, read, populate, preview, and API key auth. | Verify: example tests. | Commit: `Add public API examples`
- T098 | Version: v0.14.4 | Status: pending | Goal: Add admin manual QA checklist for every panel. | Verify: checklist browser review. | Commit: `Add admin QA checklist`
- T099 | Version: v0.14.5 | Status: pending | Goal: Add release notes template and changelog workflow. | Verify: docs review. | Commit: `Add release notes workflow`
- T100 | Version: v0.14.6 | Status: pending | Goal: Phase 13 release check. | Verify: phase release verification. | Commit: `Release docs QA phase`

### Phase 14: API And UI Polish

- T101 | Version: v0.15.0 | Status: pending | Goal: Add stable error response format across all APIs. | Verify: API tests. | Commit: `Standardize API errors`
- T102 | Version: v0.15.1 | Status: pending | Goal: Add API pagination metadata consistency across admin and public endpoints. | Verify: pagination tests. | Commit: `Standardize pagination metadata`
- T103 | Version: v0.15.2 | Status: pending | Goal: Add admin loading, empty, error, and success states consistently. | Verify: Browser Use UI audit. | Commit: `Polish admin states`
- T104 | Version: v0.15.3 | Status: pending | Goal: Add accessibility checks for forms, buttons, tables, and language toggle. | Verify: browser checklist. | Commit: `Improve admin accessibility`
- T105 | Version: v0.15.4 | Status: pending | Goal: Add responsive admin checks for mobile and desktop layouts. | Verify: Browser Use screenshots. | Commit: `Improve admin responsive layout`
- T106 | Version: v0.15.5 | Status: pending | Goal: Add API docs route with live route catalog generated from metadata. | Verify: docs browser check. | Commit: `Add live API catalog`
- T107 | Version: v0.15.6 | Status: pending | Goal: Phase 14 release check. | Verify: phase release verification. | Commit: `Release API UI polish phase`

### Phase 15: v1 Readiness

- T108 | Version: v0.16.0 | Status: pending | Goal: Audit all public package exports and remove accidental internals. | Verify: export audit tests. | Commit: `Audit public package exports`
- T109 | Version: v0.16.1 | Status: pending | Goal: Audit all source/doc/test files for 250-line rule and split offenders. | Verify: line-count script. | Commit: `Enforce file size rule`
- T110 | Version: v0.16.2 | Status: pending | Goal: Audit migrations and upgrade safety from current installs. | Verify: upgrade tests. | Commit: `Audit upgrade safety`
- T111 | Version: v0.16.3 | Status: pending | Goal: Audit npm package metadata, README, license, and install docs. | Verify: npm pack check. | Commit: `Audit package metadata`
- T112 | Version: v0.16.4 | Status: pending | Goal: Add final security review checklist for RBAC, tenants, auth, storage, and backups. | Verify: checklist review. | Commit: `Add security review checklist`
- T113 | Version: v0.16.5 | Status: pending | Goal: Add final performance review for indexes, cache, search, webhooks, and tenant filters. | Verify: performance tests. | Commit: `Add performance readiness checks`
- T114 | Version: v0.16.6 | Status: pending | Goal: Add final manual Browser Use release script covering installer, login, tenants, roles, APIs, docs, and backup restore. | Verify: browser release script. | Commit: `Add browser release script`
- T115 | Version: v0.16.7 | Status: pending | Goal: Add final v1 API freeze checklist. | Verify: checklist review. | Commit: `Add API freeze checklist`
- T116 | Version: v0.16.8 | Status: pending | Goal: Phase 15 release check. | Verify: phase release verification. | Commit: `Release v1 readiness phase`

### Phase 16: Final Release

- T117 | Version: v1.0.0 | Status: pending | Goal: Run full release gate and fix only release-blocking failures. | Verify: `npm run release:check`, Browser Use full release script. | Commit: `Run final release gate`
- T118 | Version: v1.0.1 | Status: pending | Goal: Tag final release locally after clean status and verified docs/admin/API flow. | Verify: git tag and status. | Commit: `Release Apiagex v1`
