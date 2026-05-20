# Workflow Builder Release Checkpoint

This checkpoint is for the first Workflow Builder milestone. It is a release-hardening note, not a new feature plan.

Ye checkpoint first Workflow Builder milestone ke release gate ke liye hai. Iska kaam verify karna hai ki shipped flow practical tarike se chal raha hai.

## Milestone Scope

Included:

- Workflow storage, CRUD, activation, and run history.
- Admin UI list/form workflow builder with validation and test run.
- Workflow routes mounted under `/api/custom`.
- Custom API Permissions integration for public and token-protected workflow routes.
- Swagger/OpenAPI listing for discovered custom and workflow routes.
- Workflow nodes for route trigger, validate body, query entries, create entry, get entry, update entry, delete entry, branch, set variable, HTTP request, password hash, password verify, and return response.
- Templates for register starter, order status, and report workflows.
- Practical docs for setup, browser verification, custom API permissions, and client calls.
- Provider E2E coverage for SQLite, PostgreSQL, and MySQL when provider URLs are supplied.

Not included in this checkpoint:

- Publishing to npm. That stays in the separate publish task and needs explicit maintainer approval.
- Workflow import/export implementation. Current task only plans it.
- Encrypted workflow secret storage. Current HTTP node supports env-backed `secret:namespace.key` references.
- Workflow-issued client/app-user token node. It remains planned before production login/OTP/Google templates.

## Release Gate

Run these before publish:

```bash
npm run check
npm run smoke
npm audit --audit-level=high
npx vitest run packages/server/tests/workflow-provider-e2e.test.ts
git diff --check
```

For full provider verification, set PostgreSQL and MySQL test URLs before the provider test:

```bash
APIAGEX_TEST_POSTGRES_URL='postgres://USER:PASSWORD@127.0.0.1:5433/DB' \
APIAGEX_TEST_MYSQL_URL='mysql://USER:PASSWORD@127.0.0.1:3307/DB' \
npx vitest run packages/server/tests/workflow-provider-e2e.test.ts
```

Dry-run npm packaging only:

```bash
npm publish -w @apiagex/database --access public --dry-run
npm publish -w @apiagex/server --access public --dry-run
npm publish -w create-apiagex --access public --dry-run
```

## Observed Checkpoint

Recorded on 2026-05-20 for package version `0.8.16`:

- `npm run release:check`: passed.
- `git diff --check`: passed.
- Manual HTTP API flow: passed with owner bootstrap, schema, entries, active workflow create after server startup, workflow test run, blocked custom API call, public allow, successful workflow call, and workflow run history.
- Browser check: passed with Playwright Firefox against `/doc`; release checkpoint docs were visible in the rendered docs page.
- Provider E2E: passed for SQLite, PostgreSQL, and MySQL using temporary Docker databases that were dropped after the test.
- npm dry-runs: passed for `@apiagex/database@0.8.16`, `@apiagex/server@0.8.16`, and `create-apiagex@0.8.16`.
- Publish: not performed.

## Manual API Flow

Use an isolated SQLite database and start the server:

```bash
rm -f /tmp/apiagex-workflow-release.sqlite /tmp/apiagex-workflow-release.sqlite-*
APIAGEX_DATABASE_PROVIDER=sqlite \
APIAGEX_DATABASE_PATH=/tmp/apiagex-workflow-release.sqlite \
HOST=127.0.0.1 \
PORT=4370 \
npm run dev -w @apiagex/server
```

Then verify:

1. `POST /api/auth/bootstrap-owner` creates the owner.
2. `POST /api/admin/schemas` creates a `products` schema.
3. `POST /api/admin/schemas/:schemaId/entries` creates product entries.
4. `POST /api/admin/workflows` creates an active `POST /products/lookup` workflow.
5. `POST /api/admin/workflows/:workflowId/test-run` returns matching entries.
6. `POST /api/custom/products/lookup` returns `403 CUSTOM_API_PERMISSION_DENIED` before permission is allowed.
7. `GET /api/admin/custom-api-routes` lists `/api/custom/products/lookup`.
8. `PUT /api/admin/roles/:roleId/custom-api-permissions` allows the route for `public`.
9. `POST /api/custom/products/lookup` succeeds without an Authorization header.
10. `GET /api/admin/workflows/:workflowId/runs` shows the successful API run.

Hinglish: Active workflow save hone ke baad route restart ke bina callable hona chahiye. Permission allow hone se pehle route block rahega; public ya token role allow karne ke baad call chalegi.

## Browser Check

Use [workflow-builder-browser-check.md](./workflow-builder-browser-check.md) for the repeatable Admin UI browser flow:

- Owner setup/login.
- Schema and entries.
- Workflow create, step setup, test run, and activation.
- Custom API permission allow.
- Public and token API calls.

## Publish Decision

Publish only after:

- Release gate passes.
- Browser check passes.
- Provider E2E passes for SQLite, PostgreSQL, and MySQL.
- npm dry-runs produce valid package tarballs.
- Maintainer explicitly approves publish.
