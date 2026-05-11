# Apiagex Task 10.0.13 Queue

Task 10.0.13 adds short-lived one-time realtime session tokens and practical client docs.

Task 10.0.13 short-lived one-time realtime session tokens aur practical client docs add karta hai.

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

#### T1016 - Add Realtime Session Tokens

- Version: `v10.0.13`
- Status: `completed`
- Goal: Replace long-lived API token query usage with short-lived one-time realtime session tokens for browser WebSocket connections.
- Persona: Client developer building live boards where permanent API tokens should not be placed in WebSocket URLs.
- Success Criteria: `POST /api/realtime/session` accepts an API token, schema slug, and optional ttl; verifies `getAll`; returns `rt_` token and `expiresAt`; WebSocket accepts `session=rt_...`; session token is one-time use; expired/used/permission-invalid sessions are rejected; already connected sockets stay connected after session expiry.
- Constraints: Keep existing `token` and `roleId` compatibility for development, but docs recommend session tokens for production. Do not store raw API tokens.
- Output: DB session repository, API route, WebSocket validation, tests, practical docs/context updates, browser QA.
- Verify: Session API tests, WebSocket one-time/expiry tests, docs browser QA, standard verification.
- Commit: `Add realtime session tokens`

#### T1017 - Document Practical Realtime Session Client Flow

- Version: `v10.0.13`
- Status: `completed`
- Goal: Explain exactly how users create realtime sessions, connect, reconnect, handle expiry, and protect long-lived API tokens.
- Persona: Frontend developer implementing kitchen boards, dashboards, CRM queues, or any live client screen.
- Success Criteria: Docs include step-by-step production client flow, complete JS example, what expires and what does not, one-time-use behavior, reconnect with fresh session and `lastEventId`, and fallback to refetch.
- Constraints: Keep docs generic and practical; do not imply session expiry closes already connected sockets.
- Output: In-app docs, README/server/admin/docs updates, QA checklist updates.
- Verify: Docs browser QA and standard verification.
- Commit: `Document realtime session client flow`
