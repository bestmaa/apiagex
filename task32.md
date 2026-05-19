# Task 32 - Auto Custom API Permissions

Goal: Make project custom routes simple to write while keeping them under a secure `/api/custom` namespace with automatic Admin UI permission management.

## Rules

- User custom route code may write business paths such as `/orders/:id/pay`.
- Apiagex must mount those routes as `/api/custom/orders/:id/pay`.
- Existing `/api/custom/...` custom route definitions must not double-prefix.
- Only custom routes in the custom route plugin scope are discovered.
- Newly discovered custom APIs are blocked by default until a role or the public role is allowed.
- Keep generated content API permissions separate from custom API permissions.
- Publish only after verification, push, and npm publish workflow success.

## T3201 - Backend Custom API Registry

- Status: `completed`
- Task: Add custom API route and custom API permission tables, repositories, discovery sync, and runtime permission checks.
- Verify: Server tests cover auto-prefix, discovery, public allow, token allow, and default blocked behavior.

## T3202 - Admin UI Custom API Permissions

- Status: `completed`
- Task: Add Settings / Custom API Permissions submenu to list discovered custom APIs and allow/block them per API role.
- Verify: Admin UI build/tests pass and route navigation includes the new settings page.

## T3203 - Docs And Starter

- Status: `completed`
- Task: Update starter custom routes and docs to explain relative custom paths, `/api/custom` mounting, and permission setup.
- Verify: Scaffold tests pass.

## T3204 - Release

- Status: `completed`
- Task: Run release verification, bump version, push, publish to npm, and verify package versions.
- Verify: `release:check`, publish workflow, provider E2E, and `npm view`.

## Verification Results

- `npm run check`: passed with 49 test files, 198 tests passed, and 2 skipped.
- Focused tests for database migrations, custom routes, Admin UI routing, and generated project scaffolding passed.
- `npx npm@10.9.7 run release:check`: passed with build, tests, smoke, and audit.
- `npm ci --dry-run`: passed after regenerating the lockfile.
- GitHub publish workflow `npm-v0.8.14`: passed.
- Provider E2E workflow on `main`: passed.
- `npm view @apiagex/database version`, `npm view @apiagex/server version`, and `npm view create-apiagex version`: all returned `0.8.14`.
