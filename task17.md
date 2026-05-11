# Apiagex Task 10.0.8 Queue

Task 10.0.8 adds webhook hooks for generated content API mutations.

Task 10.0.8 generated content API mutations ke liye webhook hooks add karta hai.

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

#### T1008 - Add Content Webhooks

- Version: `v10.0.8`
- Status: `completed`
- Goal: Let admins register webhook URLs that fire when generated content entries are created, updated, or deleted.
- Persona: Admin operator who wants external systems to receive automatic notifications when content APIs change.
- Success Criteria: Admin APIs can create/list/update/delete webhooks; content admin and dynamic content create/update/delete enqueue events; matching active hooks receive signed JSON payloads; delivery attempts are logged with retry metadata; Admin UI can manage hooks and inspect deliveries.
- Constraints: Do not fail content writes when a webhook URL fails. Store webhook secrets server-side and sign deliveries with HMAC SHA-256. Keep `/doc` and `/readme` behavior unchanged.
- Output: Webhook tables/repository, dispatcher, admin webhook routes, entry/content route emission, Admin UI Webhooks screen, docs/context, tests, browser QA.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Repository tests, route tests, dispatcher success/failure tests, content mutation webhook delivery, Admin UI desktop/mobile checks, standard verification.
- Commit: `Add content webhook system`
