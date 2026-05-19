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

- Status: `in_progress`
- Task: Run release verification, bump version, push, publish to npm, and verify package versions.
- Verify: `release:check`, publish workflow, provider E2E, and `npm view`.
