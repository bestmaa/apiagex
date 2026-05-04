# Apiagex Fresh Rebuild Task Queue

This queue is now reset for a fresh MVP rebuild. Project setup stays, old implementation code is removed, and new work starts only from user-approved product flow.
Ye queue fresh MVP rebuild ke liye reset hai. Project setup rahega, purana implementation code hata diya gaya hai, aur naya kaam user-approved flow se hi start hoga.

## Operating Rules

- Work on exactly one task at a time.
- Pick the first task with `Status: pending`.
- Change it to `in_progress` before editing code.
- Finish, verify, document, version when needed, commit, then move to the next task.
- Do not invent product behavior. If the MVP flow is unclear, stop at the active planning task and ask the user.
- Keep package/workspace setup stable unless a task explicitly changes it.
- Keep every source, docs, test, script, plugin, and skill file below 250 lines.
- Keep clean strict TypeScript. Avoid `any`; if unavoidable, document why.
- Put shared types in matching `*.type.ts` files.
- Update English and Hinglish docs for every user-facing behavior.
- Add or update tests for every behavior change.
- Use one local server: `/api`, `/docs`, `/readme`, and `/adminui` on the same host/port.
- Use Browser Use for every Admin UI/docs check.
- Test APIs after backend changes with automated tests and one manual request flow.
- Commit after every completed task with the listed commit message.
- Do not push unless the user asks or a release task says so.
- Current backup is available at branch `backup/pre-mvp-rebuild` and tag `backup-pre-mvp-rebuild`.

## Standard Verification

```powershell
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm run check"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm run smoke"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && npm audit --audit-level=high"
wsl.exe -e bash -lc "cd /home/aditya/projects/apiagex && git diff --check"
```

If code is intentionally absent during reset, run `git diff --check`, inspect deleted scope, and commit the reset task only.

## GPT-5.5 Low-Token Prompt

```text
Apiagex fresh MVP rebuild runner.
Read agent.md, PROJECT_CONTEXT.md, and tasks.md. Pick first pending task.
Do not invent product behavior. Use the user's latest MVP instruction as source of truth.
Keep files <250 lines, strict TS, matching *.type.ts, English+Hinglish docs, tests for behavior changes.
Use one server for /api /docs /readme /adminui.
Verify code tasks with npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
Use Browser Use for Admin UI/docs verification. Commit after each completed task.
```

## Queue

### Phase 0: Reset And Intake

- T001 | Version: reset | Status: completed | Goal: Back up current implementation and remove old package code while preserving workspace setup. | Verify: backup ref exists and deleted scope reviewed. | Commit: `Reset implementation for fresh MVP`
- T002 | Version: spec | Status: pending | Goal: Capture the user's fresh MVP flow in writing before coding. | Verify: user confirms schema -> entry -> API -> role flow. | Commit: `Document fresh MVP flow`
- T003 | Version: spec | Status: pending | Goal: Write concise product contract for owner login, schema builder, entries, generated APIs, docs, and RBAC. | Verify: docs review. | Commit: `Define MVP product contract`
- T004 | Version: spec | Status: pending | Goal: Convert product contract into small implementation phases and acceptance checks. | Verify: task review. | Commit: `Plan MVP implementation phases`

### Phase 1: Minimal Running Platform

- T005 | Version: v0.1.0 | Status: pending | Goal: Add minimal server app with health route and single-port static mounts. | Verify: health API test. | Commit: `Add minimal server shell`
- T006 | Version: v0.1.1 | Status: pending | Goal: Add minimal Admin UI shell served from `/adminui`. | Verify: Browser Use shell check. | Commit: `Add admin shell`
- T007 | Version: v0.1.2 | Status: pending | Goal: Add docs/readme static routes with English/Hinglish placeholders. | Verify: Browser Use docs check. | Commit: `Add docs shell`
- T008 | Version: v0.1.3 | Status: pending | Goal: Add local SQLite connection, migration runner, and reset-safe dev config. | Verify: migration test. | Commit: `Add SQLite foundation`
- T009 | Version: v0.1.4 | Status: pending | Goal: Add dev owner login and session token boundary. | Verify: login API test. | Commit: `Add owner login`
- T010 | Version: v0.1.5 | Status: pending | Goal: Release minimal platform checkpoint. | Verify: phase release verification. | Commit: `Release minimal platform`

### Phase 2: Dynamic API Builder MVP

- T011 | Version: v0.2.0 | Status: pending | Goal: Add content schema table and repository. | Verify: repository tests. | Commit: `Add schema repository`
- T012 | Version: v0.2.1 | Status: pending | Goal: Add field table and validation rules for text, number, boolean, date, JSON, media, and relation. | Verify: validation tests. | Commit: `Add field validation`
- T013 | Version: v0.2.2 | Status: pending | Goal: Add admin schema APIs for create/list/read/update/delete. | Verify: API tests and manual request. | Commit: `Add schema admin APIs`
- T014 | Version: v0.2.3 | Status: pending | Goal: Add Admin UI Create API flow for schema and fields. | Verify: Browser Use create schema flow. | Commit: `Add create API UI`
- T015 | Version: v0.2.4 | Status: pending | Goal: Add entry table, repository, and schema-based validation. | Verify: entry tests. | Commit: `Add entry repository`
- T016 | Version: v0.2.5 | Status: pending | Goal: Add Admin UI entry create/list/edit flow after schema creation. | Verify: Browser Use first entry flow. | Commit: `Add entry admin UI`
- T017 | Version: v0.2.6 | Status: pending | Goal: Add generated public API routes per schema for list/read/create/update/delete where enabled. | Verify: API CRUD tests and manual request. | Commit: `Add generated content APIs`
- T018 | Version: v0.2.7 | Status: pending | Goal: Release dynamic API builder checkpoint. | Verify: phase release verification. | Commit: `Release API builder MVP`

### Phase 3: Docs And RBAC MVP

- T019 | Version: v0.3.0 | Status: pending | Goal: Add generated docs panel per API with URLs, examples, auth notes, and copy buttons. | Verify: Browser Use docs panel check. | Commit: `Add generated API docs`
- T020 | Version: v0.3.1 | Status: pending | Goal: Add roles table, built-in owner/admin/editor/viewer roles, and owner bypass. | Verify: role tests. | Commit: `Add MVP roles`
- T021 | Version: v0.3.2 | Status: pending | Goal: Add per-API allow/block permissions for read/create/update/delete/manage. | Verify: permission tests. | Commit: `Add API permissions`
- T022 | Version: v0.3.3 | Status: pending | Goal: Add Admin UI role assignment flow per API. | Verify: Browser Use role allow/block flow. | Commit: `Add role assignment UI`
- T023 | Version: v0.3.4 | Status: pending | Goal: Document API builder and RBAC in English/Hinglish. | Verify: docs browser check. | Commit: `Document MVP API builder`
- T024 | Version: v0.3.5 | Status: pending | Goal: Release docs and RBAC checkpoint. | Verify: phase release verification. | Commit: `Release docs RBAC MVP`

### Phase 4: Polish After User Review

- T025 | Version: v0.4.0 | Status: pending | Goal: Apply user feedback to Admin UI navigation, empty states, labels, and forms. | Verify: Browser Use UX review. | Commit: `Polish MVP admin UX`
- T026 | Version: v0.4.1 | Status: pending | Goal: Add audit basics for login, schema, entry, and role changes. | Verify: audit tests. | Commit: `Add MVP audit log`
- T027 | Version: v0.4.2 | Status: pending | Goal: Add backup/export basics for schema and entries. | Verify: backup tests. | Commit: `Add MVP backup export`
- T028 | Version: v0.4.3 | Status: pending | Goal: Add installer starter after MVP flow is stable. | Verify: generated starter smoke. | Commit: `Add MVP starter installer`
- T029 | Version: v0.4.4 | Status: pending | Goal: Add full manual Browser Use release checklist. | Verify: checklist run. | Commit: `Add MVP browser checklist`
- T030 | Version: v1.0.0 | Status: pending | Goal: Final MVP release gate. | Verify: full release verification. | Commit: `Release Apiagex MVP`
