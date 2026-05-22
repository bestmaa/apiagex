# Apiagex 0.8.19 Release Notes

Release target: `0.8.19`

## What Changed

- Added Admin UI support for AI automation tokens under Settings.
- Added a token generator with name, expiry, and scope controls.
- Added one-time token display with copy action.
- Added active/revoked automation token list and revoke action.
- Updated generated projects to depend on `@apiagex/server` `^0.8.19`.
- Added Admin UI regression tests for the automation-token flow.

## Why

`0.8.18` exposed CLI and MCP commands correctly, but creating the temporary automation token still required CLI/admin-token handling. This patch lets an owner create the token directly from the Admin UI.

## Verification

- Admin UI browser check: Settings -> AI Automation Tokens renders after owner login.
- Admin UI browser check: generated a temporary token and displayed the one-time secret.
- `npm run test -- --run packages/admin/src/pages/SettingsAutomationTokens.test.tsx packages/admin/src/app-route.test.ts packages/admin/src/pages/SettingsPage.test.tsx`: passed.
- `npm run build -w @apiagex/admin`: passed.

## Publish

Publish through GitHub Actions tag `npm-v0.8.19`.
