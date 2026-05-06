# Apiagex Task 4 Queue

Task 4 focuses on rebuilding the Admin UI visual design and UX quality after Task 3 relation modeling is complete. The design direction is inspired by free admin dashboard patterns such as Themesberg-style control panels, but the implementation must be custom for Apiagex and must not copy any template directly.

Task 4 ka focus Admin UI ka design aur UX seriously improve karna hai. Free admin dashboard patterns se inspiration le sakte hain, but Apiagex ka UI apna custom hoga, direct copy nahi.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep files under 250 lines where practical; if a file grows past 250 lines, split it before continuing unless the file is generated or a short-term task note explains why.
- Do not dump all UI into one file; split Admin UI into clear layout, components, hooks, utils, and type files.
- Keep Admin UI code inside `packages/admin/src` organized by purpose: reusable UI in `components/`, route/page components in `pages/`, layout shell in `layout/`, hooks in `hooks/`, helpers in `utils/`, and shared types in `*.type.ts`.
- Keep CSS organized: tokens/theme foundation first, layout styles separate from reusable component styles, and page-specific styles only when necessary.
- Prefer reusable small components for buttons, panels, badges, lists, dialogs, empty states, and form rows; avoid over-abstracting one-off logic.
- Do a quick code-quality pass before every commit: file size, duplicated CSS, unclear names, unused code, accessibility labels, and responsive behavior.
- Keep product docs in English + Hinglish where user-facing.
- Browser-facing Admin UI tasks must be verified on desktop and mobile.
- Every visual change must support light and dark mode unless the task says documentation only.
- Do not copy a Figma/template design exactly; use it only as inspiration.
- Do not add marketing hero sections inside Admin UI.
- Do not use cards inside cards.
- Keep Admin UI practical: dense, readable, calm, and made for repeated CMS/API work.
- Do not break existing smoke flow: `npm run smoke` must keep passing.
- To save context, first scan only task headings and `Status` lines, then read the full details only for the first pending task.
- Do not read completed task bodies unless they are needed to debug or understand a dependency.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## GPT-5.5 Low-Token Prompt

```text
Apiagex task4 runner.
Read agent.md, PROJECT_CONTEXT.md, task3.md, task4.md. Pick first task4 `Status: pending` only.
To save context, scan task headings/status first, then read only the first pending task details.
Before code: mark task in_progress. After verified: mark completed and commit exact message.
Keep one server: /api /adminui /doc /readme. Do not break npm run smoke.
Strict TS, files <250 lines, shared types in *.type.ts, no future-task behavior.
Keep Admin UI structured: packages/admin/src/components, pages, layout, hooks, utils, *.type.ts. Split large files before commit.
Keep CSS structured: tokens/theme first, reusable component styles, then page-specific styles only when needed.
Before every commit do code-quality pass: file size, duplication, names, unused code, a11y labels, responsive behavior.
Task4 focus: Admin UI redesign, custom practical SaaS control panel, light/dark mode, responsive desktop/mobile, schemas, entries, APIs, roles, users, docs.
Design inspiration allowed from free admin dashboards, but do not copy exact screens, colors, spacing, or components.
Use icons where useful, avoid marketing hero UI, avoid nested cards, keep tables/forms dense and readable.
Every UI task must verify desktop+mobile browser and light+dark mode.
Docs tasks: English+Hinglish where user-facing.
Run npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
```

## Design Direction

- Inspiration source: free admin dashboard/control-panel patterns, especially clean sidebar + topbar + dense content layouts.
- Apiagex custom identity: API/CMS builder, schema-first workflow, relation-aware entries, generated APIs, RBAC operations.
- Visual tone: professional SaaS tool, not landing page.
- Layout: persistent sidebar on desktop, compact top navigation/mobile drawer on mobile.
- Theme: first-class light and dark mode with stable tokens.
- Typography: readable, compact, no viewport-scaled font sizes.
- Components: buttons, inputs, selects, tables, badges, tabs, segmented controls, tooltips, empty states, modals, toasts.
- Accessibility: keyboard focus, labels, contrast, aria names, no text overlap.

## Task Format

Each task uses this structure:

- Version
- Status
- Goal
- Persona
- Success Criteria
- Constraints
- Output
- Strict Rule
- Verify
- Commit

## Queue

### Phase 1: Design Foundation

#### T401 - Define Admin UI Design Tokens

- Version: `v4.1.0`
- Status: `completed`
- Goal: Add a design token foundation for colors, spacing, typography, radii, borders, shadows, and focus states.
- Persona: Design system engineer; make UI changes consistent before redesigning screens.
- Success Criteria: Admin UI uses named CSS variables for light and dark mode foundations.
- Constraints: Styling foundation only; do not redesign every page yet.
- Output: Tokenized CSS foundation.
- Strict Rule: No one-off color palette spread across components.
- Verify: Browser `/adminui` desktop/mobile light/dark plus standard verification.
- Commit: `Define admin design tokens`

#### T402 - Add Light Dark Theme Toggle

- Version: `v4.1.1`
- Status: `completed`
- Goal: Add a persistent light/dark mode toggle to Admin UI.
- Persona: UX engineer; make theme switching obvious and reliable.
- Success Criteria: User can switch light/dark mode; preference persists across reload.
- Constraints: Use local storage only; no backend setting.
- Output: Theme toggle and theme state.
- Strict Rule: No flash of unreadable theme on reload.
- Verify: Browser reload check in light/dark desktop/mobile plus standard verification.
- Commit: `Add admin theme toggle`

#### T403 - Rework Admin App Shell

- Version: `v4.1.2`
- Status: `completed`
- Goal: Replace the current basic shell with a proper control-panel layout.
- Persona: Product UI architect; make navigation feel like a real admin product.
- Success Criteria: Desktop has sidebar and topbar; mobile has compact navigation without overlap.
- Constraints: Keep existing routes and hash routing.
- Output: Admin shell layout update.
- Strict Rule: Do not hide any existing section.
- Verify: Browser `/adminui` all nav items desktop/mobile light/dark plus standard verification.
- Commit: `Rework admin app shell`

#### T404 - Add Admin Icon System

- Version: `v4.1.3`
- Status: `completed`
- Goal: Add consistent icons for navigation and key actions.
- Persona: Interface designer; improve scan speed without adding clutter.
- Success Criteria: Dashboard, Schemas, Entries, APIs, Roles, Users, Docs, theme toggle, create, edit, delete have consistent icons.
- Constraints: Prefer existing icon dependency if present; otherwise add a lightweight accepted icon package.
- Output: Iconized navigation/actions.
- Strict Rule: Icons must have accessible labels or visible text.
- Verify: Browser nav/action scan desktop/mobile plus standard verification.
- Commit: `Add admin icons`

#### T405 - Normalize Admin Buttons And Controls

- Version: `v4.1.4`
- Status: `completed`
- Goal: Create consistent button, input, select, textarea, checkbox, and helper text styles.
- Persona: Frontend systems engineer; make forms predictable.
- Success Criteria: Forms across Admin UI share visual styles and focus states.
- Constraints: CSS/components only; do not change API behavior.
- Output: Unified control styling.
- Strict Rule: Focus states must be visible in light and dark mode.
- Verify: Browser keyboard/focus check desktop/mobile plus standard verification.
- Commit: `Normalize admin controls`

### Phase 2: Dashboard And Navigation

#### T406 - Redesign Dashboard Overview

- Version: `v4.2.0`
- Status: `completed`
- Goal: Turn Dashboard into a useful operational overview.
- Persona: Product designer; show the owner what exists and what to do next.
- Success Criteria: Dashboard shows schemas, entries, APIs, roles, users, and relation readiness summaries.
- Constraints: Use existing APIs/data only.
- Output: Dashboard overview UI.
- Strict Rule: No decorative marketing hero.
- Verify: Browser dashboard desktop/mobile light/dark plus standard verification.
- Commit: `Redesign admin dashboard`

#### T407 - Add Quick Actions Panel

- Version: `v4.2.1`
- Status: `completed`
- Goal: Add practical quick actions for common workflows.
- Persona: Workflow designer; reduce clicks for owner tasks.
- Success Criteria: Dashboard offers quick links to create schema, create entry, view APIs, create role, create user.
- Constraints: Links only unless existing forms can be safely focused.
- Output: Quick actions UI.
- Strict Rule: Quick actions must not duplicate hidden routes.
- Verify: Browser quick action navigation desktop/mobile plus standard verification.
- Commit: `Add admin quick actions`

#### T408 - Add Breadcrumb And Page Headers

- Version: `v4.2.2`
- Status: `completed`
- Goal: Add consistent page titles, descriptions, and breadcrumbs.
- Persona: Information architect; make location and task clear.
- Success Criteria: Every Admin UI route has a consistent header and current location.
- Constraints: Keep copy concise; English + Hinglish only where helpful.
- Output: Page header pattern.
- Strict Rule: Headers must not consume too much vertical space.
- Verify: Browser all routes desktop/mobile plus standard verification.
- Commit: `Add admin page headers`

#### T409 - Improve Mobile Navigation

- Version: `v4.2.3`
- Status: `completed`
- Goal: Make Admin UI navigation reliable on narrow screens.
- Persona: Mobile UX engineer; prevent cramped nav and overlapping controls.
- Success Criteria: Mobile nav can open/close, route links are tappable, current route visible.
- Constraints: No new routing library.
- Output: Mobile navigation update.
- Strict Rule: No horizontal page overflow at 390px width.
- Verify: Browser mobile nav all routes light/dark plus standard verification.
- Commit: `Improve admin mobile navigation`

#### T410 - Add Empty Loading Error States

- Version: `v4.2.4`
- Status: `completed`
- Goal: Standardize empty, loading, and error states across Admin UI.
- Persona: Product UX engineer; make system state understandable.
- Success Criteria: Schemas, Entries, APIs, Roles, Users have clear states.
- Constraints: Do not change backend errors.
- Output: Reusable state presentation.
- Strict Rule: Error messages must remain visible and copyable.
- Verify: Browser empty state checks plus standard verification.
- Commit: `Standardize admin states`

### Phase 3: Schema Builder Redesign

#### T411 - Redesign Schema List

- Version: `v4.3.0`
- Status: `completed`
- Goal: Make schema list easier to scan and manage.
- Persona: CMS admin designer; help owners understand schema inventory.
- Success Criteria: List shows name, slug, field count, relation count, and actions cleanly.
- Constraints: Use existing schema response.
- Output: Schema list redesign.
- Strict Rule: Long schema names must wrap or truncate safely.
- Verify: Browser schema list desktop/mobile light/dark plus standard verification.
- Commit: `Redesign schema list`

#### T412 - Redesign Schema Create Form

- Version: `v4.3.1`
- Status: `completed`
- Goal: Improve schema creation form layout and readability.
- Persona: Form designer; reduce confusion while creating APIs.
- Success Criteria: Name, slug, description, and fields are grouped with clear controls.
- Constraints: Same backend payload.
- Output: Schema form redesign.
- Strict Rule: Required controls must keep labels.
- Verify: Browser create schema flow desktop/mobile plus standard verification.
- Commit: `Redesign schema form`

#### T413 - Improve Field Builder Rows

- Version: `v4.3.2`
- Status: `completed`
- Goal: Make schema field rows compact and understandable.
- Persona: Data modeling UX designer; make field editing less messy.
- Success Criteria: Field name, slug, type, required, relation target/type, and remove action are visually organized.
- Constraints: Keep existing field behavior.
- Output: Field row UI update.
- Strict Rule: Relation controls must not disappear on mobile.
- Verify: Browser field builder desktop/mobile light/dark plus standard verification.
- Commit: `Improve field builder rows`

#### T414 - Add Field Type Badges

- Version: `v4.3.3`
- Status: `completed`
- Goal: Show clear badges for field types and relation types.
- Persona: Visual systems designer; make schemas scannable.
- Success Criteria: Schema details use badges for text, number, boolean, JSON, media, relation, and relation kind.
- Constraints: No data model changes.
- Output: Field badge UI.
- Strict Rule: Badge colors must pass contrast in light and dark mode.
- Verify: Browser schema details light/dark plus standard verification.
- Commit: `Add field type badges`

#### T415 - Improve Relation Builder UX

- Version: `v4.3.4`
- Status: `completed`
- Goal: Make relation type and target selection clearer.
- Persona: CMS teacher; help users choose correct relation semantics.
- Success Criteria: Relation fields show relation direction, target schema, value shape, and examples.
- Constraints: Use concise helper copy.
- Output: Relation builder UX update.
- Strict Rule: Do not add future relation behavior.
- Verify: Browser all relation types desktop/mobile plus standard verification.
- Commit: `Improve relation builder UX`

### Phase 4: Entry Manager Redesign

#### T416 - Redesign Entry Schema Selector

- Version: `v4.4.0`
- Status: `completed`
- Goal: Make entry schema selection clearer and more useful.
- Persona: Content editor UX designer; make switching collections easy.
- Success Criteria: Selector shows current schema and entry count context.
- Constraints: Use existing data where available.
- Output: Entry selector redesign.
- Strict Rule: Schema switching must not break edit state.
- Verify: Browser schema switch desktop/mobile plus standard verification.
- Commit: `Redesign entry selector`

#### T417 - Redesign Entry Form Layout

- Version: `v4.4.1`
- Status: `completed`
- Goal: Improve generated entry form layout for all field types.
- Persona: Form UX engineer; make content entry feel reliable.
- Success Criteria: Text, long text, number, boolean, date, JSON, media, single relation, multi relation fields fit cleanly.
- Constraints: Same payload behavior.
- Output: Entry form redesign.
- Strict Rule: JSON errors and required errors must remain visible.
- Verify: Browser create/edit entry desktop/mobile light/dark plus standard verification.
- Commit: `Redesign entry form`

#### T418 - Improve Relation Entry Pickers

- Version: `v4.4.2`
- Status: `completed`
- Goal: Make single and multi relation pickers easier to use.
- Persona: Content editor; make relation choices understandable.
- Success Criteria: Pickers show target schema, labels, selected state, empty target state, and helper copy.
- Constraints: Native select is acceptable unless replacing safely.
- Output: Relation picker UI update.
- Strict Rule: Multi relation values must still save arrays.
- Verify: Browser relation create/edit/reload desktop/mobile plus standard verification.
- Commit: `Improve relation entry pickers`

#### T419 - Redesign Entry List

- Version: `v4.4.3`
- Status: `completed`
- Goal: Make entry list useful for scanning content.
- Persona: Content operations designer; show key fields and relation summaries.
- Success Criteria: Entry rows show id, primary label, field summaries, relation summaries, updated time, actions.
- Constraints: Use existing entry data.
- Output: Entry list redesign.
- Strict Rule: Long values must not break layout.
- Verify: Browser entry list desktop/mobile light/dark plus standard verification.
- Commit: `Redesign entry list`

#### T420 - Add Entry Action Confirmations

- Version: `v4.4.4`
- Status: `completed`
- Goal: Improve edit/delete action clarity.
- Persona: Safety UX engineer; prevent accidental destructive actions.
- Success Criteria: Delete has a clear confirmation; edit/cancel states are obvious.
- Constraints: No new modal library unless needed.
- Output: Entry action UX.
- Strict Rule: Delete must not happen without confirmation.
- Verify: Browser delete cancel/confirm desktop/mobile plus standard verification.
- Commit: `Add entry action confirmations`

### Phase 5: API Explorer Redesign

#### T421 - Redesign API List

- Version: `v4.5.0`
- Status: `completed`
- Goal: Make generated APIs easy to scan.
- Persona: Developer experience designer; help users understand generated endpoints.
- Success Criteria: API page groups endpoints by schema with method, path, purpose, and auth/RBAC notes.
- Constraints: Use existing API examples.
- Output: API list redesign.
- Strict Rule: Do not document endpoints that do not exist.
- Verify: Browser APIs page desktop/mobile light/dark plus standard verification.
- Commit: `Redesign API list`

#### T422 - Add API Method Badges

- Version: `v4.5.1`
- Status: `completed`
- Goal: Add clear method/path styling for API routes.
- Persona: API docs designer; make endpoints readable.
- Success Criteria: GET/POST/PUT/DELETE methods have consistent badges and paths are copyable.
- Constraints: Visual only.
- Output: API method badge UI.
- Strict Rule: Badge colors must work in light and dark mode.
- Verify: Browser API page light/dark plus standard verification.
- Commit: `Add API method badges`

#### T423 - Improve Payload Examples

- Version: `v4.5.2`
- Status: `completed`
- Goal: Make generated payload examples more useful.
- Persona: Developer advocate; show realistic schema and relation payloads.
- Success Criteria: Examples show single relation, multi relation, populate, and RBAC header hints where relevant.
- Constraints: No fake unsupported endpoints.
- Output: API example UI update.
- Strict Rule: Examples must match backend behavior.
- Verify: Browser API examples plus standard verification.
- Commit: `Improve API examples`

#### T424 - Add Copy Buttons For API Snippets

- Version: `v4.5.3`
- Status: `completed`
- Goal: Add copy-to-clipboard buttons for API paths and snippets.
- Persona: Developer productivity engineer; reduce manual copying.
- Success Criteria: Users can copy paths and payload examples with visible success state.
- Constraints: Browser clipboard fallback must not crash.
- Output: Copy controls.
- Strict Rule: Copy buttons must have accessible labels.
- Verify: Browser copy check desktop/mobile plus standard verification.
- Commit: `Add API copy buttons`

#### T425 - Add API Empty And Permission Hints

- Version: `v4.5.4`
- Status: `completed`
- Goal: Explain API page empty states and RBAC implications.
- Persona: DX writer; help users know why APIs appear or fail.
- Success Criteria: Empty API page points to schema creation; API rows mention role permission requirement.
- Constraints: UI copy only.
- Output: API guidance UI.
- Strict Rule: Keep copy short.
- Verify: Browser API empty/non-empty states plus standard verification.
- Commit: `Add API permission hints`

### Phase 6: Roles And Users Redesign

#### T426 - Redesign Roles List

- Version: `v4.6.0`
- Status: `completed`
- Goal: Make roles easier to scan and manage.
- Persona: Security admin designer; clarify who can access what.
- Success Criteria: Roles page shows role name, description, owner/non-owner, permission summary, actions.
- Constraints: Use existing role APIs.
- Output: Roles list redesign.
- Strict Rule: Owner bypass must not be misrepresented.
- Verify: Browser roles page desktop/mobile light/dark plus standard verification.
- Commit: `Redesign roles list`

#### T427 - Redesign Permission Matrix

- Version: `v4.6.1`
- Status: `completed`
- Goal: Make role permission editing clearer.
- Persona: Access-control UX engineer; reduce permission mistakes.
- Success Criteria: Matrix clearly shows schemas, read/create/update/delete/manage actions, save state, and allowed/blocked meaning.
- Constraints: Same permission payload.
- Output: Permission matrix redesign.
- Strict Rule: Unchecked means blocked must be visually clear.
- Verify: Browser permission save allowed/blocked plus standard verification.
- Commit: `Redesign permission matrix`

#### T428 - Add Permission Summary Badges

- Version: `v4.6.2`
- Status: `completed`
- Goal: Show compact permission summaries per role.
- Persona: Security reviewer; make audits faster.
- Success Criteria: Roles list and user context show manage/read/action summaries.
- Constraints: Do not add backend aggregation unless necessary.
- Output: Permission summary UI.
- Strict Rule: Summary must not conflict with actual checkbox state.
- Verify: Browser role permission summary plus standard verification.
- Commit: `Add permission summary badges`

#### T429 - Redesign Users List

- Version: `v4.6.3`
- Status: `completed`
- Goal: Make users page feel like a real admin user manager.
- Persona: Admin UX designer; clarify user role assignment.
- Success Criteria: Users list shows email, role, created/updated context where available, and clear empty states.
- Constraints: Use existing user data.
- Output: Users list redesign.
- Strict Rule: Do not expose passwords.
- Verify: Browser users page desktop/mobile light/dark plus standard verification.
- Commit: `Redesign users list`

#### T430 - Improve User Create Form

- Version: `v4.6.4`
- Status: `completed`
- Goal: Improve user creation form and validation presentation.
- Persona: Form UX engineer; make user creation safe.
- Success Criteria: Email, password, role selector, and status messages are clean and accessible.
- Constraints: Same auth behavior.
- Output: User form redesign.
- Strict Rule: Password must not be logged or displayed after submit.
- Verify: Browser create user flow plus standard verification.
- Commit: `Improve user create form`

### Phase 7: Docs Page Inside Admin UI

#### T431 - Redesign Admin Docs View

- Version: `v4.7.0`
- Status: `completed`
- Goal: Make the Admin UI Docs route useful and visually consistent.
- Persona: Product educator; explain current workflows inside the app.
- Success Criteria: Docs route summarizes owner, schema, entry, API, relation, RBAC workflows with links.
- Constraints: Keep `/doc` and `/readme` as public docs.
- Output: Admin docs view redesign.
- Strict Rule: Do not duplicate massive docs content.
- Verify: Browser Docs route desktop/mobile light/dark plus standard verification.
- Commit: `Redesign admin docs view`

#### T432 - Add Workflow Checklists In Admin Docs

- Version: `v4.7.1`
- Status: `completed`
- Goal: Add concise in-app workflow checklists.
- Persona: Onboarding UX writer; help owners complete setup.
- Success Criteria: Docs view includes checklists for first owner setup, schema creation, relation modeling, RBAC setup.
- Constraints: Copy only.
- Output: In-app workflow checklists.
- Strict Rule: Checklist must reflect current product only.
- Verify: Browser Docs route plus standard verification.
- Commit: `Add admin workflow checklists`

#### T433 - Link Public Docs From Admin UI

- Version: `v4.7.2`
- Status: `completed`
- Goal: Add clear links from Admin UI to `/doc` and `/readme`.
- Persona: Documentation UX engineer; reduce confusion between in-app and public docs.
- Success Criteria: Links are visible and open correct pages.
- Constraints: Keep same server paths.
- Output: Docs links.
- Strict Rule: Links must not break hash routing.
- Verify: Browser link checks plus standard verification.
- Commit: `Link public docs from admin`

### Phase 8: Accessibility And Polish

#### T434 - Audit Admin Contrast

- Version: `v4.8.0`
- Status: `completed`
- Goal: Check and fix contrast issues in light and dark mode.
- Persona: Accessibility engineer; make UI readable.
- Success Criteria: Text, badges, buttons, form controls, focus rings are readable in both themes.
- Constraints: Styling only unless markup is inaccessible.
- Output: Contrast fixes.
- Strict Rule: Do not rely on color alone for critical state.
- Verify: Browser visual check desktop/mobile light/dark plus standard verification.
- Commit: `Audit admin contrast`

#### T435 - Improve Keyboard Navigation

- Version: `v4.8.1`
- Status: `pending`
- Goal: Ensure keyboard users can navigate and operate core Admin UI.
- Persona: Accessibility engineer; support non-mouse workflows.
- Success Criteria: Nav, forms, theme toggle, create/edit/delete actions, and modals are keyboard reachable.
- Constraints: Do not add heavy dependencies.
- Output: Keyboard accessibility fixes.
- Strict Rule: Focus must never disappear.
- Verify: Browser keyboard check plus standard verification.
- Commit: `Improve admin keyboard navigation`

#### T436 - Add Accessible Confirm Dialogs

- Version: `v4.8.2`
- Status: `pending`
- Goal: Standardize confirmations for destructive actions.
- Persona: Accessibility-focused UI engineer; make confirmations safe.
- Success Criteria: Confirm dialogs have labels, focus management, escape/cancel behavior.
- Constraints: Use simple custom component if needed.
- Output: Accessible confirm dialog.
- Strict Rule: Destructive actions require explicit confirm.
- Verify: Browser delete confirmation keyboard/mobile plus standard verification.
- Commit: `Add accessible confirm dialogs`

#### T437 - Polish Responsive Tables

- Version: `v4.8.3`
- Status: `pending`
- Goal: Make table/list content usable on mobile.
- Persona: Responsive UI engineer; avoid horizontal overflow.
- Success Criteria: Schema, entry, API, role, user lists fit at 390px without broken layout.
- Constraints: Keep data visible enough for action.
- Output: Responsive list/table polish.
- Strict Rule: No hidden critical action on mobile.
- Verify: Browser all list pages mobile light/dark plus standard verification.
- Commit: `Polish responsive admin tables`

#### T438 - Add Toast Status System

- Version: `v4.8.4`
- Status: `pending`
- Goal: Replace scattered status text with a consistent toast/status pattern where appropriate.
- Persona: Feedback UX engineer; make save/create/delete outcomes clear.
- Success Criteria: Core actions show consistent success/error feedback without hiding inline errors.
- Constraints: Keep important form errors inline.
- Output: Toast/status component.
- Strict Rule: Errors must remain copyable.
- Verify: Browser create/update/delete feedback plus standard verification.
- Commit: `Add admin toast status`

### Phase 9: Visual QA And Documentation

#### T439 - Add Admin UI Visual QA Checklist

- Version: `v4.9.0`
- Status: `pending`
- Goal: Document visual QA expectations for Admin UI.
- Persona: QA lead; make design verification repeatable.
- Success Criteria: Checklist covers light/dark, desktop/mobile, nav, forms, tables, dialogs, relation workflows, RBAC workflows.
- Constraints: Documentation only.
- Output: Admin UI visual QA checklist.
- Strict Rule: Include expected pass/fail outcomes.
- Verify: Documentation review plus standard verification.
- Commit: `Add admin visual QA checklist`

#### T440 - Update Root Docs For Admin Redesign

- Version: `v4.9.1`
- Status: `pending`
- Goal: Update README and PROJECT_CONTEXT with Task 4 design goals and completed UI behavior.
- Persona: Project maintainer; keep context current.
- Success Criteria: Root docs mention custom Admin UI redesign, light/dark mode, responsive verification, and preserved server paths.
- Constraints: Documentation only.
- Output: Root documentation update.
- Strict Rule: Do not claim unfinished screens are complete.
- Verify: Documentation review plus standard verification.
- Commit: `Update admin redesign context`

#### T441 - Sync Public Docs For Admin Redesign

- Version: `v4.9.2`
- Status: `pending`
- Goal: Update `/doc` and `/readme` with current Admin UI design behavior.
- Persona: Docs maintainer; explain visible UI changes.
- Success Criteria: Public docs mention Admin UI layout, theme toggle, core workflows, and QA expectations in English + Hinglish.
- Constraints: Docs generated through `packages/docs`.
- Output: Static docs update.
- Strict Rule: Do not document future redesign tasks as complete.
- Verify: Browser `/doc` and `/readme` plus standard verification.
- Commit: `Sync admin redesign docs`

#### T442 - Add Design Notes Document

- Version: `v4.9.3`
- Status: `pending`
- Goal: Add a design notes document explaining the custom design direction.
- Persona: Design lead; preserve decisions for future work.
- Success Criteria: Notes explain inspiration, what was not copied, tokens, layout, themes, and component rules.
- Constraints: Documentation only.
- Output: Design notes doc.
- Strict Rule: Do not include copyrighted template assets.
- Verify: Documentation review plus standard verification.
- Commit: `Add admin design notes`

### Phase 10: Release Gate

#### T443 - Verify Admin UI End To End Desktop

- Version: `v4.10.0`
- Status: `pending`
- Goal: Run a desktop browser end-to-end check across the redesigned Admin UI.
- Persona: Release QA engineer; catch broken workflows before release.
- Success Criteria: Desktop browser verifies login, dashboard, schema create, relation schema, entry create/edit, API page, role/user flow, docs route, light/dark.
- Constraints: Fix only blockers found during verification.
- Output: Desktop verification notes in task file or docs.
- Strict Rule: Do not mark complete with skipped workflow.
- Verify: Desktop browser flow plus standard verification.
- Commit: `Verify admin desktop flow`

#### T444 - Verify Admin UI End To End Mobile

- Version: `v4.10.1`
- Status: `pending`
- Goal: Run a mobile browser end-to-end check across the redesigned Admin UI.
- Persona: Mobile QA engineer; catch mobile layout and workflow issues.
- Success Criteria: Mobile browser verifies navigation, schema relation controls, entry pickers, API page, roles/users, docs route, light/dark.
- Constraints: Fix only blockers found during verification.
- Output: Mobile verification notes in task file or docs.
- Strict Rule: No horizontal overflow or overlapping critical controls.
- Verify: Mobile browser flow plus standard verification.
- Commit: `Verify admin mobile flow`

#### T445 - Verify Admin Theme Coverage

- Version: `v4.10.2`
- Status: `pending`
- Goal: Verify light/dark mode across all Admin UI routes.
- Persona: Visual QA engineer; ensure theme is complete.
- Success Criteria: Dashboard, Schemas, Entries, APIs, Roles, Users, Docs render correctly in both themes.
- Constraints: Visual fixes only.
- Output: Theme coverage fixes/notes.
- Strict Rule: No unreadable text in either theme.
- Verify: Browser all routes light/dark plus standard verification.
- Commit: `Verify admin theme coverage`

#### T446 - Verify Relation UI After Redesign

- Version: `v4.10.3`
- Status: `pending`
- Goal: Ensure redesign did not break Task 3 relation workflows.
- Persona: Regression QA engineer; protect relation modeling.
- Success Criteria: Browser verifies all four relation types, single/multi pickers, create/edit/reload, relation summaries, populate docs link.
- Constraints: Fix only relation UI regressions.
- Output: Relation UI regression verification.
- Strict Rule: Many-to-many must still save arrays.
- Verify: Browser relation regression plus standard verification.
- Commit: `Verify redesigned relation UI`

#### T447 - Verify RBAC UI After Redesign

- Version: `v4.10.4`
- Status: `pending`
- Goal: Ensure redesign did not break roles, permissions, users, and allowed/blocked API flow.
- Persona: Security QA engineer; protect access-control workflows.
- Success Criteria: Browser/API verifies role creation, permission save, user creation, allowed request, blocked request.
- Constraints: Fix only RBAC regressions.
- Output: RBAC UI regression verification.
- Strict Rule: Blocked role must return `API_PERMISSION_DENIED`.
- Verify: Browser/API RBAC flow plus standard verification.
- Commit: `Verify redesigned RBAC UI`

#### T448 - Final Admin UI Polish Pass

- Version: `v4.10.5`
- Status: `pending`
- Goal: Make a final small polish pass after verification tasks.
- Persona: Senior product engineer; clean up visible rough edges.
- Success Criteria: No obvious spacing, overlap, wording, contrast, or responsive issues remain.
- Constraints: Small fixes only; no new feature scope.
- Output: Final polish fixes.
- Strict Rule: Do not start a new redesign in this task.
- Verify: Browser smoke of key routes plus standard verification.
- Commit: `Polish final admin UI`

#### T449 - Add Admin Redesign Release Notes

- Version: `v4.10.6`
- Status: `pending`
- Goal: Add concise release notes for Task 4 Admin UI redesign.
- Persona: Release writer; summarize what changed.
- Success Criteria: Notes mention custom design, light/dark mode, responsive layout, improved core workflows, and verification.
- Constraints: Documentation only.
- Output: Release notes update.
- Strict Rule: Do not mention copied template usage.
- Verify: Documentation review plus standard verification.
- Commit: `Add admin redesign release notes`

#### T450 - Release Apiagex Task 4

- Version: `v4.11.0`
- Status: `pending`
- Goal: Final Task 4 release gate for Admin UI redesign.
- Persona: Release engineer; release only verified UI.
- Success Criteria: Standard verification passes, browser checks cover `/adminui` desktop/mobile light/dark, `/doc`, `/readme`, relation UI, RBAC UI, and no pending Task 4 tasks remain.
- Constraints: No new feature work unless required to fix release blockers.
- Output: Task 4 release checkpoint update.
- Strict Rule: Do not mark complete with skipped browser checks unless user explicitly accepts the risk.
- Verify: Standard verification, browser desktop/mobile light/dark, `/doc`, `/readme`, relation flow, RBAC flow.
- Commit: `Release Apiagex task 4`
