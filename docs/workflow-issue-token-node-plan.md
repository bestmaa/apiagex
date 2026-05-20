# Workflow Issue Token Node Plan

This document defines the planned token/session issuing node for Workflow APIs. It is needed before login, OTP login, Google login, or custom app-user auth templates can be considered production-ready.

Ye plan app/client users ke token ke liye hai. Admin UI owner session aur Content API token system ko mix nahi karna hai.

## Core Rule

Workflow-issued tokens are for application/client users, not Admin UI owners.

Do not issue:

- Admin owner tokens.
- Control-plane admin sessions.
- Long-lived root tokens.
- Tokens that bypass Content API permissions.

## Planned Node

### issueToken

Purpose: issue a short-lived client token/session after a workflow has authenticated an app user.

Planned config:

```json
{
  "id": "issue-token",
  "type": "issueToken",
  "config": {
    "subject": "{{steps.find-user.entries.0.id}}",
    "role": "reader",
    "expiresInSeconds": 3600,
    "claims": {
      "email": "{{steps.find-user.entries.0.data.email}}"
    },
    "outputKey": "session"
  }
}
```

Planned output:

```json
{
  "accessToken": "CLIENT_TOKEN",
  "expiresAt": "2026-05-20T18:00:00.000Z",
  "tokenType": "Bearer"
}
```

The output may include the token because the route response needs to return it to the authenticated client. Stored workflow run history must redact it.

## Token Type

Preferred MVP token type:

```txt
opaque random token stored hashed in database
```

Reason:

- Easy revocation.
- No JWT key-rotation complexity in MVP.
- Token can be checked against database on each request.
- Storing only a token hash limits database leakage impact.

Future option:

```txt
signed JWT access token + refresh token
```

JWT should wait until issuer, audience, key rotation, revocation, and refresh-token storage are designed.

## Token Storage

Planned table:

```txt
client_sessions
  id
  token_hash
  subject_type        content_entry
  subject_id
  role_id
  claims_json
  expires_at
  revoked_at
  created_by_workflow_id
  created_by_run_id
  created_at
  last_used_at
```

Rules:

- Store hash of token, not raw token.
- Token hash should use SHA-256 or HMAC-SHA256 with server secret.
- Raw token is returned once in workflow response.
- Admin UI can revoke sessions but cannot reveal raw token.

## Subject Binding

`subject` should identify the app user or entity the token belongs to.

MVP subject:

```txt
content entry id from a users schema
```

Required validation:

- Subject must resolve to a non-empty string.
- Subject should exist when the workflow has a user lookup/create step.
- Token should store `subject_type` so future subjects are possible.

## Role Binding

The issued token should bind to a Content/API role, not an Admin role.

Allowed:

```txt
reader
single-reader
writer
editor
public-derived custom API roles
```

Not allowed:

```txt
owner
admin
schema-manager
user-manager
```

Reason: Admin roles control the control plane. Content API roles control generated/content/custom APIs.

## Expiry

Required:

- `expiresInSeconds` defaults to a short value.
- Minimum: `60`.
- Maximum MVP: `86400` (24 hours).
- Expired tokens fail with `CLIENT_TOKEN_EXPIRED`.

Recommended defaults:

```txt
access token: 3600 seconds
refresh token: not in MVP
```

## Revocation

Revocation requirements:

- Store `revoked_at`.
- Auth check rejects revoked sessions.
- Admin UI later lists and revokes client sessions.
- Password reset should revoke sessions for a subject.
- Role deletion should either block or revoke sessions bound to that role.

Error codes:

```txt
CLIENT_TOKEN_INVALID
CLIENT_TOKEN_EXPIRED
CLIENT_TOKEN_REVOKED
CLIENT_TOKEN_ROLE_NOT_FOUND
```

## Claims

Claims are optional JSON metadata for client apps.

Rules:

- Claims must be JSON.
- Claims must be size-limited.
- Claims must not contain password hashes, OTPs, provider access tokens, or secrets.
- Claims can include display-safe values such as email, name, and tenant id.

Example:

```json
{
  "email": "user@example.com",
  "tenantId": "tenant_123"
}
```

## Content API Authentication

Workflow-issued client tokens should work through the same request auth surface as API tokens, but as a distinct token class.

Request:

```bash
curl http://127.0.0.1:4000/api/content/orders \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

Auth resolver order:

1. Check API token table.
2. Check client session token table.
3. Resolve role permissions.
4. Attach subject metadata for custom routes/workflows.

This preserves one permission evaluator while keeping token storage separate.

## Login Workflow Shape

```txt
routeTrigger
validateBody(email,password)
queryEntries(users by email)
branch user exists
verifyPassword
branch password matched
issueToken(subject=user entry id, role=reader)
returnResponse(accessToken, expiresAt)
```

Public error response:

```json
{
  "ok": false,
  "error": "INVALID_CREDENTIALS"
}
```

Do not reveal whether lookup or password verify failed.

## OTP And Google Login Shape

OTP verify and Google login should also end with `issueToken` after identity proof succeeds.

Examples:

- OTP verify consumes a valid challenge, then issues token.
- Google login verifies Google ID token server-side, then issues token for matching/created user.

## Redaction

Raw access tokens must be redacted from:

- Workflow run history.
- Test run history unless the test panel explicitly marks it as response output.
- Server logs.
- Webhooks.
- Realtime event history.
- Admin audit logs.

Response output can return the token to the caller only for the actual login/OTP/Google route.

## Admin UI Requirements

Later Admin UI should include:

- Session list by subject and role.
- Revoke session.
- Revoke all sessions for subject.
- Expiry/status filters.
- Workflow run link that created the session.
- No raw token reveal.

## Tests Required For Implementation

Minimum tests:

- issueToken creates an opaque token and stores only hash.
- Token can authenticate Content API calls with bound role permission.
- Expired token is rejected.
- Revoked token is rejected.
- Admin roles cannot be used as token role.
- Missing subject fails.
- Claims are size-limited and redacted for sensitive keys.
- Login workflow returns token only on successful verify.
- Wrong password and missing user return same public error.

## Implementation Order

1. Add client session table/repository.
2. Add token hash/verify utilities.
3. Add `issueToken` workflow node validator.
4. Add executor node.
5. Integrate client token auth into Content API/custom API permission resolver.
6. Add session revocation APIs.
7. Add Admin UI session management.
8. Update login/OTP/Google templates.
9. Add end-to-end auth tests.

This should land after password hashing and before production auth templates are advertised.
