# Apiagex Task 10.0.6 Queue

Task 10.0.6 adds API tokens for content API roles.

Task 10.0.6 content API roles ke liye API tokens add karta hai.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep files under 250 lines where practical.
- Every behavior change must include tests and docs.
- Browser-facing Admin UI tasks must verify desktop and mobile.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

#### T1006 - Add Content Role API Tokens

- Version: `v10.0.6`
- Status: `completed`
- Goal: Generate revocable API tokens for content API roles and use those tokens to enforce content API permissions.
- Persona: Admin operator who wants to give a client a token instead of exposing or manually passing a raw role id.
- Success Criteria: Content Roles can create/list/revoke tokens for API roles; created token is shown once; content APIs accept `Authorization: Bearer TOKEN` and `x-apiagex-api-token`; valid tokens use the role's saved permissions; revoked or invalid tokens are rejected.
- Constraints: Do not let admin/control-plane roles create content API tokens. Do not store plaintext tokens in the database.
- Output: Token table/repository, admin token APIs, content API token auth, Admin UI token panel, docs/context, tests, browser QA.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Token create/list/revoke routes, content API allow/block with tokens, Content Roles desktop/mobile token panel, standard verification.
- Commit: `Add content role API tokens`
