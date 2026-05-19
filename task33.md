# Task 33 - Custom API Polish And Verification

Goal: Make custom APIs easier to manage, document, audit, and verify from Admin UI and OpenAPI.

## Rules

- Custom API routes remain mounted under `/api/custom`.
- Discovered custom routes must appear in OpenAPI only when content/custom API docs are enabled.
- Manual route labels and groups must survive server restarts and rediscovery.
- Permission allow/block changes must record who changed them and when.
- Inactive route cleanup must never delete a route still discovered on the last server start.
- Documentation must show a practical token-to-permission-to-call flow.
- Verify the Admin UI Custom API Permissions page with Playwright.

## T3301 - Backend Metadata, Cleanup, And Audit

- Status: `completed`
- Task: Add route metadata update, inactive route delete, permission audit events, and stable name/group sync.
- Verify: Server tests cover rename persistence, inactive cleanup, and permission history.

## T3302 - OpenAPI Custom Routes

- Status: `completed`
- Task: Add actual discovered active custom routes to `/api/openapi.json` with path parameters, method, label, group, and permission notes.
- Verify: OpenAPI tests cover discovered custom routes.

## T3303 - Admin UI Management

- Status: `completed`
- Task: Add custom route search/filter, manual label/group rename, permission history view, and inactive cleanup controls.
- Verify: Admin build/tests pass and Playwright confirms the UI flow.

## T3304 - Practical Docs

- Status: `completed`
- Task: Add end-to-end custom route docs: write route, restart/discover, create token, allow permission, call API.
- Verify: Docs include a copy-ready curl example and Admin UI steps.

## T3305 - Full Verification

- Status: `completed`
- Task: Run focused tests, package checks, and Playwright browser verification.
- Verify: Report commands and results.

## Verification Results

- `npx vitest run packages/database/tests/migrations.test.ts packages/server/tests/custom-routes.test.ts packages/server/tests/openapi-routes.test.ts`: passed, 23 tests.
- `npm run test -w @apiagex/admin`: passed, 16 tests.
- `npm run build -w @apiagex/admin`, `npm run build -w @apiagex/database`, `npm run build -w @apiagex/server`, and `npm run build -w create-apiagex`: passed.
- `npm run check`: passed, 49 test files, 202 tests passed, 2 skipped.
- Playwright Admin UI verification passed on `http://127.0.0.1:4217/adminui#settings/custom-api-permissions`: login, search `orders`, rename label/group, allow public access, save, and view permission history.
