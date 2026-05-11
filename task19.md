# Apiagex Task 10.0.10 Queue

Task 10.0.10 adds opt-in realtime WebSocket APIs for generated content APIs.

Task 10.0.10 generated content APIs ke liye opt-in realtime WebSocket APIs add karta hai.

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

#### T1010 - Add Opt-In Realtime WebSocket APIs

- Version: `v10.0.10`
- Status: `completed`
- Goal: Let admins enable realtime WebSocket events per generated content API and document client delivery/reconnect handling.
- Persona: Admin operator building live screens such as order boards, kitchen boards, dashboards, and operational queues.
- Success Criteria: Settings exposes Realtime API toggles per collection; enabled collections publish `entry.created`, `entry.updated`, and `entry.deleted` WebSocket events; disabled collections do not publish; WebSocket subscriptions enforce API role/token read permission when provided; events include `messageId`, schema, entry, occurredAt, and ack guidance; clients can ack messages and receive ack confirmation; docs explain connect, event payloads, ack, reconnect, and refetch fallback in English/Hinglish.
- Constraints: Realtime must be opt-in per dynamic API. WebSocket delivery must not make content writes fail. Webhooks stay server-to-server and are not replaced.
- Output: DB realtime config, server routes/broker, Admin UI Settings screen, in-app docs, tests, docs/context updates, browser QA.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Realtime API route tests, WebSocket publish/ack test, Admin UI realtime settings test, Admin UI docs link desktop/mobile, standard verification.
- Commit: `Add opt-in realtime websocket APIs`
