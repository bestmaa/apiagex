# Apiagex Task 10.0.3 Queue

Task 10.0.3 fixes Settings submenu height and scrolling.

Task 10.0.3 Settings submenu ki height aur scrolling fix karta hai.

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

#### T1003 - Fix Settings Submenu Height

- Version: `v10.0.3`
- Status: `completed`
- Goal: Make the Settings submenu behave like a normal compact menu, not tall stretched cards.
- Persona: Admin UI operator who needs a predictable left submenu with scroll when content grows.
- Success Criteria: Settings submenu items have normal compact height; sidebar, submenu, and workspace stay within viewport on desktop; overflowing submenu/workspace content scrolls; mobile remains readable.
- Constraints: Do not change Settings route behavior or role permission semantics.
- Output: Shell CSS, docs/context update, browser QA, and verification.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Admin UI Settings desktop/mobile, standard verification.
- Commit: `Fix settings submenu height`
