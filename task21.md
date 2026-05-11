# Apiagex Task 10.0.12 Queue

Task 10.0.12 adds realtime event history visibility and retention cleanup.

Task 10.0.12 realtime event history visibility aur retention cleanup add karta hai.

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

#### T1014 - Show Realtime Event History In Admin UI

- Version: `v10.0.12`
- Status: `completed`
- Goal: Make recent realtime event history visible from Settings > Realtime API.
- Persona: Admin operator checking whether live boards received or can replay recent events.
- Success Criteria: Admin API returns recent realtime events; Admin UI lists recent events with event id, collection, event type, entry id, and timestamp; empty state is clear.
- Constraints: Do not expose secrets or tokens. Keep history compact.
- Output: DB history list helper, admin route response, UI history table/list, tests, docs.
- Verify: Realtime API route test, Admin UI test, browser QA.
- Commit: `Add realtime history admin view`

#### T1015 - Add Realtime Event Retention Cleanup

- Version: `v10.0.12`
- Status: `completed`
- Goal: Prevent realtime event history from growing forever.
- Persona: Owner running Apiagex for long-lived live dashboards.
- Success Criteria: Server prunes old realtime events after new events are recorded; default keeps latest 1000 events per schema; admin API exposes retention config summary; docs explain default and why it exists.
- Constraints: Cleanup must not fail content writes. Keep retention simple and deterministic.
- Output: DB cleanup helper, broker cleanup call, API/doc updates, tests.
- Verify: Retention unit/route tests and standard verification.
- Commit: `Add realtime event retention cleanup`
