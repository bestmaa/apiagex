# Apiagex Task 28 Queue

This queue turns database provider support into small, verifiable steps. SQLite stays the default and continues to use `better-sqlite3`; PostgreSQL and MySQL must be real runtime providers before they appear as supported setup choices.

Ye queue database provider work ko chhote tasks me todta hai. SQLite default rahega aur `better-sqlite3` par chalega; PostgreSQL/MySQL tabhi supported bolenge jab real driver, migration, setup, test, aur docs complete honge.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/checks pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Keep SQLite on `better-sqlite3` as the default local database.
- Do not show PostgreSQL or MySQL as supported setup choices until their runtime adapters and tests are complete.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep practical docs in English + Hinglish where user-facing.
- Keep generated projects simple: `.env`, `.env.example`, `apiagex.config.json`, and `src/index.js`.
- Use `project-test` only for fresh scaffold verification; do not touch unrelated folders like `project-test/check1`.
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
Apiagex task28 runner.
Read agent.md, PROJECT_CONTEXT.md, tasks.md, task2.md, task28.md. Pick first task28 `Status: pending` only.
Before code: mark task in_progress. After verified: mark completed and commit exact message.
Keep SQLite default on better-sqlite3. Do not fake PostgreSQL/MySQL support.
Strict TS, shared types in *.type.ts, no future-task behavior.
Generated projects must keep .env, .env.example, apiagex.config.json, src/index.js.
Use project-test only for fresh scaffold verification and do not touch unrelated folders.
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

### Phase 1: Provider Boundary Without Behavior Change

#### T2801 - Plan Database Provider Queue

- Version: `v0.7.0`
- Status: `completed`
- Goal: Rewrite the rough database provider note into this task2-style queue with clear rules, task boundaries, verification, and exact commit messages.
- Persona: Technical lead; keep the work ordered so provider support does not become a risky rewrite.
- Success Criteria: `task28.md` follows the same task structure as `task2.md`, includes SQLite/PostgreSQL/MySQL boundaries, and makes first-pending-task execution explicit.
- Constraints: Documentation/planning only; do not change runtime behavior in this task.
- Output: Updated `task28.md`.
- Strict Rule: Do not start provider code until this queue is committed.
- Verify: Review `task28.md`; run standard verification.
- Commit: `Plan database provider adapters`

#### T2802 - Add Database Adapter Boundary

- Version: `v0.7.0`
- Status: `completed`
- Goal: Add a provider-neutral database adapter contract and a SQLite adapter backed by `better-sqlite3`, without migrating existing repository behavior yet.
- Persona: Backend infrastructure engineer; introduce the boundary with very low blast radius.
- Success Criteria: Adapter types cover `get`, `all`, `run`, `exec`, `transaction`, and `close`; SQLite adapter works through the new contract; current database exports remain compatible.
- Constraints: Do not convert repository functions to async in this task; do not add PostgreSQL/MySQL dependencies yet.
- Output: Adapter type file, SQLite adapter file, exports, and focused adapter tests.
- Strict Rule: Existing SQLite repository/API behavior must be unchanged.
- Verify: Database adapter tests plus standard verification.
- Commit: `Add database adapter boundary`

#### T2803 - Migrate Repositories To Adapter

- Version: `v0.7.1`
- Status: `completed`
- Goal: Move database repository code from direct `better-sqlite3` calls onto the adapter contract.
- Persona: Refactor engineer; make the mechanical migration carefully and keep behavior identical.
- Success Criteria: Schema, entry, content, role, user, webhook, realtime, token, and owner flows use the adapter boundary; SQLite tests and smoke still pass.
- Constraints: Use only the SQLite adapter while migrating; do not add PostgreSQL/MySQL behavior yet.
- Output: Updated repository/server database usage and tests.
- Strict Rule: Do not change public API routes, payloads, permissions, or Admin UI behavior.
- Verify: Repository/API tests plus standard verification.
- Commit: `Migrate repositories to database adapter`

### Phase 2: Provider SQL And Runtime Adapters

#### T2804 - Split Provider Migration SQL

- Version: `v0.7.2`
- Status: `completed`
- Goal: Split migration SQL by provider so SQLite, PostgreSQL, and MySQL each have valid DDL.
- Persona: Database engineer; make migrations explicit and testable for each engine.
- Success Criteria: SQLite keeps current SQL; PostgreSQL uses compatible serial/boolean/text/FK syntax; MySQL uses compatible auto-increment/boolean/text/FK syntax; migration record behavior stays consistent.
- Constraints: Do not wire PostgreSQL/MySQL runtime connections yet.
- Output: Provider SQL modules and SQL generation tests.
- Strict Rule: Existing SQLite migrations must not change unless a test proves the change is required.
- Verify: Migration SQL tests plus standard verification.
- Commit: `Split provider migration SQL`

#### T2805 - Add PostgreSQL Adapter

- Version: `v0.7.3`
- Status: `completed`
- Goal: Add real PostgreSQL runtime support through `pg`.
- Persona: Backend database engineer; make Postgres a real adapter, not a setup label.
- Success Criteria: `APIAGEX_DATABASE_PROVIDER=postgres` and `APIAGEX_DATABASE_URL=postgres://...` work; `?` parameters convert to `$1`, `$2`; update/delete returns consistent `{ changes }`.
- Constraints: Integration tests may be gated by `APIAGEX_TEST_POSTGRES_URL`; unit tests must still cover SQL/config behavior without a local server.
- Output: PostgreSQL adapter, config handling, tests, and docs notes.
- Strict Rule: If no Postgres URL is present, tests must clearly skip only real integration, not adapter unit coverage.
- Verify: PostgreSQL adapter/config tests, optional integration test, and standard verification.
- Commit: `Add postgres database adapter`

#### T2806 - Add MySQL Adapter

- Version: `v0.7.4`
- Status: `pending`
- Goal: Add real MySQL runtime support through `mysql2`.
- Persona: Backend database engineer; make MySQL a real adapter, not a setup label.
- Success Criteria: `APIAGEX_DATABASE_PROVIDER=mysql` and `APIAGEX_DATABASE_URL=mysql://...` work; positional `?` parameters work; update/delete returns consistent `{ changes }`.
- Constraints: Integration tests may be gated by `APIAGEX_TEST_MYSQL_URL`; unit tests must still cover SQL/config behavior without a local server.
- Output: MySQL adapter, config handling, tests, and docs notes.
- Strict Rule: If no MySQL URL is present, tests must clearly skip only real integration, not adapter unit coverage.
- Verify: MySQL adapter/config tests, optional integration test, and standard verification.
- Commit: `Add mysql database adapter`

### Phase 3: Setup, Docs, E2E, Release

#### T2807 - Add Provider Setup Wizard

- Version: `v0.7.5`
- Status: `pending`
- Goal: Update `create-apiagex` so first setup asks for the database provider and writes correct project files for the selected provider.
- Persona: CLI product engineer; make setup practical for new users.
- Success Criteria: Setup prompts for sqlite/postgres/mysql; SQLite asks for path; PostgreSQL/MySQL ask for database URL; generated `.env`, `.env.example`, `apiagex.config.json`, `src/index.js`, and README match the provider.
- Constraints: Only expose PostgreSQL/MySQL in setup after runtime adapters are complete.
- Output: CLI prompts, scaffold rendering, tests, and docs.
- Strict Rule: Do not overwrite an existing target folder without explicit confirmation.
- Verify: CLI tests, fresh `project-test` scaffold checks, and standard verification.
- Commit: `Add database provider setup`

#### T2808 - Verify Provider E2E And Docs

- Version: `v0.7.6`
- Status: `pending`
- Goal: Run end-to-end verification and write practical provider documentation.
- Persona: Release QA engineer; prove the full flow works before publishing.
- Success Criteria: Fresh generated project starts; health check passes; owner bootstrap/login works; docs explain SQLite, PostgreSQL, MySQL setup, env vars, errors, and troubleshooting in English + Hinglish.
- Constraints: Use local Postgres/MySQL integration only when URLs are available; otherwise document skipped real DB checks clearly.
- Output: E2E notes, docs updates, and any small fixes needed by verification.
- Strict Rule: Do not publish from this task.
- Verify: `npm ci`, `npm run release:check`, fresh `project-test` install/run, optional provider integrations, and standard verification.
- Commit: `Verify database provider setup`

#### T2809 - Publish Provider Adapter Release

- Version: `v0.8.0`
- Status: `pending`
- Goal: Publish the provider adapter release and verify install commands from npm.
- Persona: Release engineer; ship only after checks are green.
- Success Criteria: Package versions are bumped consistently; GitHub Actions publish succeeds; npm registry shows new versions; `npm create apiagex@latest` creates a working project.
- Constraints: Use the established npm publish workflow; do not publish from a dirty tree.
- Output: Version bump, release commit/tag/workflow run, and post-publish verification notes.
- Strict Rule: If publish fails, fix only the release blocker and rerun verification.
- Verify: GitHub Actions publish result, npm registry check, fresh `npm create apiagex@latest` verification, and standard verification before publish.
- Commit: `Release database provider adapters`
