# Apiagex Task 8 Queue

Task 8 focuses on splitting dynamic API read permissions so list reads and single-entry reads can be assigned separately.

Task 8 ka focus dynamic API read permissions ko split karna hai taaki list reads aur single-entry reads alag assign ho sakein.

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

#### T801 - Split Get And GetAll Permissions

- Version: `v8.0.1`
- Status: `completed`
- Goal: Add separate `getAll` and `get` role permissions for dynamic API list and single-entry GET routes.
- Persona: RBAC engineer; make permissions match the actual generated API operations.
- Success Criteria: Role UI shows `getAll`, `get`, `create`, `update`, `delete`, and `manage`; dynamic list routes require `getAll`; dynamic single read routes require `get`; `manage` still allows all schema actions; tests verify split behavior.
- Constraints: Preserve create, update, delete, manage, owner bypass, and existing CRUD route shapes.
- Output: Updated permission model, content route enforcement, role UI labels/help, tests, docs, and project context.
- Strict Rule: Do not change entry storage or dynamic API URL shapes.
- Verify: Permission repository tests, RBAC flow tests, role route tests, Admin UI Roles desktop/mobile, and standard verification.
- Commit: `Split get and getAll permissions`
