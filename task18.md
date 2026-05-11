# Apiagex Task 10.0.9 Queue

Task 10.0.9 adds replay-safe webhook signature verification docs and headers.

Task 10.0.9 replay-safe webhook signature verification docs aur headers add karta hai.

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

#### T1009 - Add Replay Safe Webhook Signatures

- Version: `v10.0.9`
- Status: `completed`
- Goal: Add delivery id and timestamp to webhook signatures and document receiver-side verification from the Admin UI.
- Persona: Admin operator who wants third-party webhook receivers to reject fake or replayed webhook requests.
- Success Criteria: Webhook deliveries include `x-apiagex-delivery-id` and `x-apiagex-timestamp`; signatures cover timestamp, delivery id, and raw body; server exposes a verifier helper; Admin UI Webhooks links to in-app verification docs with English/Hinglish examples.
- Constraints: Do not expose webhook secrets in webhook bodies or read APIs. Keep content writes independent from webhook delivery failures.
- Output: Replay-safe signature code, tests, Admin UI docs link, in-app docs verification guide, docs/context updates, browser QA.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Signature/header tests, verifier tests, Admin UI docs link desktop/mobile, standard verification.
- Commit: `Add replay safe webhook signatures`
