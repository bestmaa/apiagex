# Apiagex Task 10.0.11 Queue

Task 10.0.11 makes realtime WebSocket APIs reliable enough for practical live boards.

Task 10.0.11 realtime WebSocket APIs ko practical live boards ke liye reliable banata hai.

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

#### T1011 - Add Realtime Missed Event Replay

- Version: `v10.0.11`
- Status: `completed`
- Goal: Store realtime events and replay missed events when clients reconnect with `lastEventId`.
- Persona: Client developer building kitchen boards, order boards, dashboards, and live queues that must recover after short disconnects.
- Success Criteria: Realtime events are persisted; WebSocket event payloads include stable `eventId`; clients can reconnect with `lastEventId`; server replays later events for the same schema before new live events; replayed events carry `replayed: true`; invalid/unknown `lastEventId` does not break live subscribe.
- Constraints: Realtime replay must stay opt-in per dynamic API. Realtime storage/delivery failures must not fail content writes. Keep replay bounded with a limit.
- Output: DB realtime event history, repository helpers, WebSocket replay support, tests, docs/context updates, browser QA.
- Verify: WebSocket replay tests, admin docs link desktop/mobile, standard verification.
- Commit: `Add realtime missed event replay`

#### T1012 - Write Practical Realtime Client Docs

- Version: `v10.0.11`
- Status: `completed`
- Goal: Make the realtime documentation practical enough for client developers to implement live boards safely.
- Persona: Developer integrating Apiagex into a restaurant kitchen board, CRM dashboard, notification board, logistics queue, or any generic live screen.
- Success Criteria: Docs explain setup, connection URLs, auth choices, event payload shape, ack behavior, `lastEventId`, reconnect loop, when to refetch, when to PATCH business status, and how to show stale/offline UI states in English and Hinglish.
- Constraints: Docs must be generic, not restaurant-only. Do not imply WebSocket ack changes business data.
- Output: In-app docs, README/server/admin/docs updates, QA checklist updates.
- Verify: Docs route browser QA and standard verification.
- Commit: `Document practical realtime clients`

#### T1013 - Add Realtime Live Board Smoke Example

- Version: `v10.0.11`
- Status: `completed`
- Goal: Add a small generic example snippet/test flow that proves create/update events can drive a live board and recover with `lastEventId`.
- Persona: Admin/developer who wants to validate that a board received data and can recover missed updates.
- Success Criteria: Example flow creates a schema, enables realtime, receives create/update events, acknowledges them, reconnects with `lastEventId`, and receives missed events.
- Constraints: Keep this as tests/docs, not a new product page unless requested.
- Output: Focused test and docs example.
- Verify: Focused realtime tests and standard verification.
- Commit: `Add realtime live board example flow`
