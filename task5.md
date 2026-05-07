# Apiagex Task 5 Queue

Task 5 focuses on applying the selected admin dashboard visual direction shown by the user: dark left sidebar, clean white workspace, compact topbar, soft stat panels, dense lists, and practical dashboard-style spacing. The implementation must be custom for Apiagex and must not copy the reference exactly.

Task 5 ka focus selected dashboard reference ke hisab se Admin UI ko aur clean banana hai: dark sidebar, white workspace, compact topbar, soft stat panels, dense lists, aur practical dashboard spacing. Design Apiagex ka custom hoga, exact copy nahi.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep files under 250 lines where practical; split large files before continuing.
- Keep Admin UI code organized in `packages/admin/src/components`, `pages`, `layout`, `hooks`, `utils`, and `*.type.ts`.
- Keep CSS organized: tokens/theme foundation first, layout styles separate, reusable component styles before page-specific styles.
- Browser-facing Admin UI tasks must verify desktop and mobile.
- Every visual change must support light and dark mode.
- Do not copy the screenshot exactly; use it only as visual direction.
- Do not add marketing hero UI.
- Do not use cards inside cards.
- Keep UI dense, readable, and useful for repeated CMS/API work.
- Run standard verification before commit.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## GPT-5.5 Low-Token Prompt

```text
Apiagex task5 runner.
Read agent.md, PROJECT_CONTEXT.md, task4.md, task5.md. Pick first task5 `Status: pending` only.
Before code: mark in_progress. After verified: mark completed and commit exact message.
Selected design direction: dark left sidebar, clean white workspace, compact topbar, soft stat panels, dense task/list panels, custom Apiagex implementation.
Do not copy screenshot exactly. No marketing UI. No nested cards. Keep light/dark, desktop/mobile, no overlap.
Keep one server: /api /adminui /doc /readme. Strict TS. Files <250 lines where practical.
Run npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
```

## Selected Design Direction

- Reference: user-provided dashboard screenshot with dark navy left sidebar, compact app brand, icon nav, white workspace, topbar actions, stat panels, task list, and schedule panel.
- Apiagex interpretation: API/CMS control plane with Dashboard, Schemas, Entries, APIs, Roles, Users, and Docs.
- Light mode: dark sidebar, white workspace, soft borders, low-shadow panels, compact spacing.
- Dark mode: keep dark sidebar but make workspace dark enough for contrast, not one-tone.
- Shape: 8px or less radius, clear dividers, no decorative blobs.
- Density: compact operational UI, not landing page.

## Queue

#### T501 - Apply Selected Admin Shell Style

- Version: `v5.0.1`
- Status: `completed`
- Goal: Rework Admin shell tokens and CSS toward the selected dashboard direction.
- Persona: Product UI engineer; make the shell feel like a polished SaaS admin panel.
- Success Criteria: Desktop uses dark sidebar, clean workspace, compact topbar, stronger active nav, softer panels, and mobile keeps navigation usable.
- Constraints: Styling-first; do not change backend behavior or routes.
- Output: Updated Admin shell/tokens CSS.
- Strict Rule: Use the reference as inspiration only; do not copy brand/name/assets/layout exactly.
- Verify: Browser `/adminui` dashboard desktop/mobile light/dark plus standard verification.
- Commit: `Apply selected admin shell style`

#### T502 - Redesign Dashboard Panels To Match Direction

- Version: `v5.0.2`
- Status: `completed`
- Goal: Make dashboard metrics, readiness, quick actions, and recent schemas match the selected compact dashboard feel.
- Persona: Dashboard UX engineer; improve scan speed and visual hierarchy.
- Success Criteria: Dashboard feels close to the selected operational layout while staying Apiagex-specific.
- Constraints: Keep current dashboard data and routes.
- Output: Dashboard CSS/markup polish.
- Strict Rule: No marketing hero and no nested cards.
- Verify: Browser dashboard desktop/mobile light/dark plus standard verification.
- Commit: `Redesign dashboard panels for selected style`

#### T503 - Make Schemas Page List First

- Version: `v5.0.3`
- Status: `completed`
- Goal: Open Schemas on the created schema list, with a compact Add button that reveals the schema form only when needed.
- Persona: Admin workflow engineer; make schema management feel direct and low-clutter.
- Success Criteria: Schemas route defaults to list view, Add opens create form, Edit opens selected schema in edit form, Delete removes a schema and refreshes the list.
- Constraints: Keep existing schema builder fields, relation options, validations, and backend routes.
- Output: Updated schema page flow, inventory actions, and Admin API delete helper.
- Strict Rule: Do not change schema persistence behavior beyond exposing existing delete route in the UI.
- Verify: Browser Schemas desktop/mobile light/dark plus standard verification.
- Commit: `Make schemas page list first`

#### T504 - Remove Schemas Intro And Status Panel

- Version: `v5.0.4`
- Status: `completed`
- Goal: Keep Schemas page header minimal with only the page title and a compact Add schema button.
- Persona: Admin UI cleanup engineer; remove non-essential text and bulky status UI.
- Success Criteria: Schemas route no longer shows English/Hinglish intro text or the large Schema status panel by default.
- Constraints: Keep add, edit, delete, and list-first schema behavior from T503.
- Output: Minimal Schemas page header and removed page-level status toast.
- Strict Rule: Do not remove field/form validation or schema CRUD actions.
- Verify: Browser Schemas desktop/mobile light/dark plus standard verification.
- Commit: `Remove schemas intro and status panel`

#### T505 - Tighten Schemas Page Spacing

- Version: `v5.0.5`
- Status: `completed`
- Goal: Remove the oversized Schemas page card spacing and hide the schema list while the add/edit form is open.
- Persona: Practical admin UI engineer; make the page compact and focused.
- Success Criteria: Schemas route has tight page spacing, only a small Add schema button in the header, and add/edit mode does not show the existing schema list underneath.
- Constraints: Keep schema create, edit, delete, field, and relation behavior unchanged.
- Output: Compact Schemas page layout and focused add/edit mode.
- Strict Rule: Do not change backend schema behavior.
- Verify: Browser Schemas desktop/mobile light/dark plus standard verification.
- Commit: `Tighten schemas page spacing`

#### T506 - Remove Duplicate Schemas Heading

- Version: `v5.0.6`
- Status: `completed`
- Goal: Fix the Schemas page visual hierarchy by removing the duplicate page heading and making the schema list compact.
- Persona: Admin UI reviewer; remove wasted space and make the list feel intentional.
- Success Criteria: Schemas route shows one topbar title, a compact Add schema action, and schema rows without large empty vertical gaps.
- Constraints: Keep add/edit/delete/list behavior from T503-T505.
- Output: Clean Schemas page hierarchy and tighter inventory panel/rows.
- Strict Rule: Do not change schema CRUD behavior.
- Verify: Browser Schemas desktop/mobile light/dark plus standard verification.
- Commit: `Remove duplicate schemas heading`
