# Task 29 - Three Provider End-to-End Verification

Goal: Verify a fresh generated Apiagex project against SQLite, PostgreSQL, and MySQL, then clean up all temporary data created by this test.

## Rules

- Use only `project-test` for generated-project verification.
- Do not touch existing `project-test/check1`.
- Do not touch existing application databases except the two temporary databases named here.
- Delete old temporary provider DBs before testing: `apiagex_pg_e2e`, `apiagex_mysql_e2e`.
- Create fresh provider DBs for the test and delete them after the report is captured.
- Keep secrets out of the final report.
- Use Admin UI browser automation where it proves the UI flow, and API/WebSocket calls where they prove backend delivery/state better than visual clicks.
- Capture a practical report with pass/fail status, ports, providers, and cleanup status.

## T2901 - Cleanup Old Provider Test Databases

- Status: `completed`
- Provider: PostgreSQL, MySQL
- Test: Drop only `apiagex_pg_e2e` and `apiagex_mysql_e2e`.
- Verify: Existing production/user DBs still exist and containers remain healthy.

## T2902 - Fresh Generated Project Setup

- Status: `completed`
- Provider: All
- Test: Create `project-test/task29-cms` with `npm create apiagex@latest`, install dependencies, and confirm generated `src/index.js`, `.env`, `.env.example`, `apiagex.config.json`, Admin UI, docs, and smoke command.
- Verify: `npm run smoke` passes in the generated project.

## T2903 - SQLite End-to-End

- Status: `completed`
- Provider: SQLite
- Tests:
  - Start generated project on a free port with a fresh SQLite path.
  - Use Admin UI browser automation to bootstrap/login owner.
  - Use Admin UI/API flow to create schema, entry, API role, API token, user, webhook, and realtime config.
  - Verify content API list/read with role token.
  - Verify webhook signed delivery is received and delivery history is stored.
  - Verify realtime WebSocket event delivery, ack path, recent event history, and reconnect replay.
  - Verify Admin UI pages render: Dashboard, Schemas, Entries, APIs, Users, Settings > Content Roles, Webhooks, Realtime API.
- Cleanup: Stop server and delete generated SQLite data folder.

## T2904 - PostgreSQL End-to-End

- Status: `completed`
- Provider: PostgreSQL
- Tests:
  - Create fresh `apiagex_pg_e2e`.
  - Start generated project with `APIAGEX_DATABASE_PROVIDER=postgres` and the local Docker URL.
  - Repeat the full T2903 feature flow.
- Cleanup: Stop server and drop only `apiagex_pg_e2e`.

## T2905 - MySQL End-to-End

- Status: `completed`
- Provider: MySQL
- Tests:
  - Create fresh `apiagex_mysql_e2e`.
  - Start generated project with `APIAGEX_DATABASE_PROVIDER=mysql` and the local Docker URL.
  - Repeat the full T2903 feature flow.
- Cleanup: Stop server and drop only `apiagex_mysql_e2e`.

## T2906 - Final Report

- Status: `completed`
- Output:
  - Write `docs/provider-e2e-report.md`.
  - Include what was tested for each provider, what passed, what was cleaned up, and any known limitations.
  - Include exact verification commands without printing database passwords.
