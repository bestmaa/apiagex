# Apiagex 0.9.15

This patch completes the content-user login flow for protected generated APIs.

## Fixed

- Added signed, expiring content-user tokens returned by `POST /api/auth/login-user`.
- Generated content APIs now accept content-user login tokens with `Authorization: Bearer TOKEN` and enforce the user's assigned API role permissions.
- Custom APIs and realtime session creation also accept content-user login tokens through the same role permission checks.
- Swagger/OpenAPI now documents `/api/auth/login-user`, content-user token responses, and bearer auth for API tokens or content-user tokens.
- Admin UI now explains public no-login access versus protected content-user/API-token access, and removes production-facing `x-apiagex-role-id` guidance.

## Verification

- Focused server auth, content, custom API, realtime, OpenAPI, RBAC, project audit, and release smoke tests.
- Focused Admin UI permission and user manager tests.
- Server and Admin UI builds.
