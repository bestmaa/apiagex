# Apiagex Task 10 Queue

Task 10 adds a Settings access-control page with separate admin-panel roles and content API roles.

Task 10 Settings access-control page add karta hai jisme admin-panel roles aur content API roles alag sections me rahenge.

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

#### T1001 - Add Settings Access Control

- Version: `v10.0.1`
- Status: `completed`
- Goal: Add Settings with separate Admin Panel Roles and Content API Roles sections so owner can manage admin/control-plane access without mixing it into generated API roles.
- Persona: Admin platform engineer; keep control-plane permissions and generated content API permissions isolated.
- Success Criteria: Settings page appears in Admin UI; Admin Panel Roles section lists owner/admin/schema-manager/user-manager and supports custom admin roles; admin permissions can be saved for admin areas; Content API Roles section lists API roles and links to API permission management; admin roles remain blocked from content API access.
- Constraints: Do not merge admin permissions into schema/content API permissions; do not let API roles manage Admin UI.
- Output: Settings route, admin role APIs, admin permission repository, tests, docs, and project context.
- Strict Rule: Admin permissions are stored separately from content API permissions.
- Verify: Database tests, settings route tests, Admin UI Settings desktop/mobile, docs/readme check, manual owner/admin-role content API block, and standard verification.
- Commit: `Add settings access control`
