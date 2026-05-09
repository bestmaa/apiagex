# Apiagex Task 10.0.4 Queue

Task 10.0.4 moves Entries collections into the left submenu.

Task 10.0.4 Entries collections ko left submenu me move karta hai.

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

#### T1004 - Move Entries Collections To Submenu

- Version: `v10.0.4`
- Status: `completed`
- Goal: Show all Entries collections in the same attached left submenu pattern used by Settings.
- Persona: Admin UI operator who wants collections next to the main left menu, not inside the page content.
- Success Criteria: Entries route opens a compact main menu plus attached Collections submenu; collection buttons select the active schema; main entry table/form stays in the content area; sidebar, submenu, and content keep 100vh desktop scroll behavior; mobile remains readable.
- Constraints: Do not change entry CRUD/query behavior or generated content API behavior.
- Output: Reusable admin subnav slot, Entries collection submenu, CSS, docs/context, browser QA.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Entries desktop/mobile submenu, create/select collection flow, standard verification.
- Commit: `Move entries collections to submenu`
