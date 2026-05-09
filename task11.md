# Apiagex Task 10.0.2 Queue

Task 10.0.2 refines Settings navigation and keeps version steps incremental.

Task 10.0.2 Settings navigation ko refine karta hai aur version steps incremental rakhta hai.

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

#### T1002 - Settings Role Subnavigation

- Version: `v10.0.2`
- Status: `completed`
- Goal: Move role management under Settings subnavigation with separate Admin Roles and Content Roles views.
- Persona: Admin UI operator who expects Settings to own role configuration without mixing admin and content API roles.
- Success Criteria: Clicking Settings opens an attached left subnavigation; the primary sidebar compacts on desktop; Settings exposes Admin Roles and Content Roles options; Admin Roles manages admin permissions; Content Roles manages generated API roles.
- Constraints: Keep admin roles separate from content API roles; do not change content API permission semantics; keep mobile navigation usable.
- Output: Settings subroutes, compact sidebar/subnav styles, tests, docs, and context updates.
- Strict Rule: Version numbering must advance as `v10.0.x`, not a new major task version.
- Verify: Admin UI Settings desktop/mobile, docs/readme route text, focused admin route tests, and standard verification.
- Commit: `Refine settings role navigation`
