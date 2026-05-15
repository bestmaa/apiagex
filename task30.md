# Task 30 - Provider CI And PostgreSQL Query Serialization

Goal: Remove the PostgreSQL adapter deprecation warning seen during provider E2E and add a CI workflow that can verify provider support before release.

## Rules

- Keep Task 29 report files untouched except where this task needs a new follow-up note.
- Do not modify `project-test/check1`.
- Do not create or keep local provider databases for this task.
- Keep database credentials out of docs and final output.
- Prefer targeted tests for adapter behavior and workflow syntax over broad unrelated changes.

## T3001 - PostgreSQL Adapter Warning Fix

- Status: `completed`
- Problem: The PostgreSQL adapter uses one `pg.Client`; concurrent calls can overlap and trigger the `pg` deprecation warning for `client.query()` while another query is already executing.
- Task: Serialize non-transaction queries while allowing statements inside a transaction callback to run on the active transaction.
- Verify: Add targeted tests for concurrent query serialization and transaction ordering.

## T3002 - Provider E2E CI Workflow

- Status: `completed`
- Task: Add a GitHub Actions workflow with PostgreSQL and MySQL service containers.
- Verify: Workflow runs build, SQLite smoke, real PostgreSQL adapter tests, real MySQL adapter tests, and generated-project runtime checks.

## T3003 - Local Verification

- Status: `completed`
- Task: Run focused package tests and workflow lint/sanity checks available locally.
- Verify: Record commands and results.

## Verification Results

- `npm test -w @apiagex/database -- tests/postgres-adapter.test.ts`: passed.
- `npm run build -w @apiagex/database`: passed.
- `npm test -w create-apiagex -- tests/generated-project.test.ts`: passed.
- `npm test -w @apiagex/database`: passed with 17 files, 64 tests passed, 2 provider integration tests skipped locally because this task did not create local provider DBs.
- `git diff --check -- task30.md packages/database/src/postgres-adapter.ts packages/database/tests/postgres-adapter.test.ts .github/workflows/provider-e2e.yml`: passed.
