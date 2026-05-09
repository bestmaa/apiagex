# Apiagex Task 9 Queue

Task 9 separates Admin UI control-plane roles from content API roles.

Task 9 Admin UI control-plane roles ko content API roles se alag karta hai.

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

#### T901 - Separate Admin And API Roles

- Version: `v9.0.1`
- Status: `completed`
- Goal: Hide owner/control-plane roles from the Role permissions screen and keep content API permissions/user assignment limited to API roles.
- Persona: RBAC architect; keep admin panel management roles separate from generated API access roles.
- Success Criteria: Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`; API roles are `reader`, `single-reader`, `writer`, `editor`, and `public`; `/api/admin/roles` lists only API roles; content API permission checks reject admin roles; users can only be assigned API roles; Role UI and User UI show API roles only.
- Constraints: Preserve existing dynamic API route shapes and the six API actions: `getAll`, `get`, `create`, `update`, `delete`, and `manage`.
- Output: Role kind migration, seeded role catalog, API-only permission enforcement, UI labels, tests, docs, and project context.
- Strict Rule: Do not implement admin-panel permission enforcement in this task; only separate the role catalogs and content API checks.
- Verify: Role repository tests, permission repository tests, user tests, owner bootstrap tests, role/user route tests, content API allow/block checks, Admin UI Roles and Users desktop/mobile, docs/readme check, and standard verification.
- Commit: `Separate admin and API roles`
