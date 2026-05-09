# Apiagex Task 6 Queue

Task 6 focuses on the Admin Entries workflow requested by the user: move the collection list to the right side, show selected collection data in a full table, and add find, filter, field visibility, last 50, and pagination support.

Task 6 ka focus user-requested Admin Entries workflow par hai: collection list right side me, selected collection ka data full table me, aur find, filter, field visibility, last 50, pagination support.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep files under 250 lines where practical; split large files before continuing.
- Browser-facing Admin UI tasks must verify desktop and mobile.
- Every behavior change must include tests and docs.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

#### T601 - Add Entries Table With Right Collection Rail

- Version: `v6.0.1`
- Status: `completed`
- Goal: Make Admin Entries show collections on the right, load clicked collection entries into a table, and support find, field visibility, last 50, and pagination.
- Persona: Admin workflow engineer; make entry browsing dense, fast, and useful for real CMS data checks.
- Success Criteria: Entries route has a right-side collection list, selected collection table, search filter, selectable visible fields, page size default 50, next/previous pagination, edit/delete actions, and backend query support.
- Constraints: Preserve entry create/edit forms, relation value handling, existing CRUD routes, and dynamic content API behavior.
- Output: Updated admin entries UI, typed API query helper, backend list query support, tests, docs, and project context.
- Strict Rule: Do not change entry persistence shape in `entries.data_json`.
- Verify: Entry API query tests, Admin UI desktop/mobile light/dark smoke, and standard verification.
- Commit: `Add entries table with right collection rail`
