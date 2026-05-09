# Apiagex Task 10.0.5 Queue

Task 10.0.5 moves Users create into a compact button flow above the user list.

Task 10.0.5 Users create ko user list ke upar compact button flow me move karta hai.

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

#### T1005 - Show Users List Before Create Form

- Version: `v10.0.5`
- Status: `completed`
- Goal: Keep the Users page list visible by default and open the create form only from a compact top button.
- Persona: Admin operator who wants to inspect users first, then create a new API user only when needed.
- Success Criteria: Users route shows top Create user button, user list is visible by default, create form opens on button click, cancel closes the form, successful create refreshes the list and closes the form.
- Constraints: Do not change user API role assignment rules or backend APIs.
- Output: Users page UI update, focused UI test, docs/context, browser QA.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Users desktop/mobile list-first flow, create button/form/cancel/create flow, standard verification.
- Commit: `Show users list before create form`
