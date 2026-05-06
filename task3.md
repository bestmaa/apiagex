# Apiagex Task 3 Queue

Task 3 focuses on real CMS content modeling, especially relation fields: one-to-one, one-to-many, many-to-one, and many-to-many. It starts from the completed Task 2 release gate.

Task 3 ka focus real CMS content modeling hai, specially relation fields: one-to-one, one-to-many, many-to-one, aur many-to-many. Ye completed Task 2 release gate ke baad start hota hai.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep product docs in English + Hinglish where user-facing.
- Browser-facing Admin UI tasks must be verified on desktop and mobile.
- Do not break existing smoke flow: `npm run smoke` must keep passing.
- Relation changes must test allowed and blocked data shapes.
- Many-to-many must not be faked as a comma string; model it clearly.
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
Apiagex task3 runner.
Read agent.md, PROJECT_CONTEXT.md, task2.md, task3.md. Pick first task3 `Status: pending` only.
To save context, scan task headings/status first, then read only the first pending task details.
Before code: mark task in_progress. After verified: mark completed and commit exact message.
Keep one server: /api /adminui /doc /readme. Do not break npm run smoke.
Strict TS, files <250 lines, shared types in *.type.ts, no future-task behavior.
Task3 focus: relation modeling, one-to-one, one-to-many, many-to-one, many-to-many, relation validation, populate, Admin UI relation builder, Entry UI relation picker.
Many-to-many must use a clear relation storage model, not comma strings. Tests must cover invalid target, required relation, allowed relation, and blocked relation.
Admin UI tasks: practical SaaS UI, no marketing hero/cards-inside-cards, verify desktop+mobile browser.
Docs tasks: English+Hinglish, preserve /doc and /readme.
Backend tasks: automated tests + manual/API check. RBAC tasks: verify allowed and blocked role/user flow.
Run npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
```

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

### Phase 1: Relation Design And Contracts

#### T301 - Define Relation Type Contract

- Version: `v2.1.0`
- Status: `completed`
- Goal: Define the relation field contract for `oneToOne`, `oneToMany`, `manyToOne`, and `manyToMany`.
- Persona: Data model architect; make relation meaning explicit before storage changes.
- Success Criteria: Shared relation types describe relation kind, target schema id, required flag, and value shape.
- Constraints: Planning plus type definitions only; no storage behavior yet.
- Output: Relation type definitions and architecture notes.
- Strict Rule: Do not change existing API behavior in this task.
- Verify: Typecheck and standard verification.
- Commit: `Define relation type contract`

#### T302 - Document Relation Semantics

- Version: `v2.1.1`
- Status: `completed`
- Goal: Explain how each relation type behaves in English + Hinglish.
- Persona: CMS teacher; write so a beginner understands relation direction and examples.
- Success Criteria: `/doc`, `/readme`, README, or PROJECT_CONTEXT explain one-to-one, one-to-many, many-to-one, and many-to-many with examples.
- Constraints: Documentation only.
- Output: Relation semantics docs.
- Strict Rule: Do not claim unsupported runtime behavior as completed.
- Verify: Browser check `/doc` and `/readme`; standard verification.
- Commit: `Document relation semantics`

#### T303 - Add Relation Field Metadata Validation

- Version: `v2.1.2`
- Status: `completed`
- Goal: Validate relation metadata when schemas are created or updated.
- Persona: Backend validation engineer; reject ambiguous relation definitions early.
- Success Criteria: Relation fields require target schema id and relation type; invalid relation type fails with a clear error.
- Constraints: Keep existing relation fields backward compatible where possible.
- Output: Schema validation updates and tests.
- Strict Rule: Invalid relation metadata must not be saved silently.
- Verify: Schema repository/API tests and standard verification.
- Commit: `Validate relation field metadata`

#### T304 - Add Relation Value Shape Contract

- Version: `v2.1.3`
- Status: `completed`
- Goal: Define entry value shapes for single and multi relation values.
- Persona: API contract designer; make request/response payloads predictable.
- Success Criteria: Single relations use one entry id or null; multi relations use an array of entry ids.
- Constraints: Contract only unless minimal type changes are needed.
- Output: Entry relation value type notes and shared types.
- Strict Rule: Do not accept comma-separated relation strings.
- Verify: Typecheck and standard verification.
- Commit: `Define relation value shapes`

#### T305 - Add Relation Error Codes

- Version: `v2.1.4`
- Status: `completed`
- Goal: Add stable error messages/codes for invalid relation type, missing target schema, invalid target entry, and invalid relation value shape.
- Persona: API reliability engineer; make failures testable and easy to debug.
- Success Criteria: Tests can assert clear relation errors without relying on vague messages.
- Constraints: Keep existing non-relation errors stable.
- Output: Relation error constants or documented error strings.
- Strict Rule: Do not mask relation errors as generic JSON errors.
- Verify: Unit tests and standard verification.
- Commit: `Add relation error codes`

#### T306 - Plan Relation Storage Model

- Version: `v2.1.5`
- Status: `completed`
- Goal: Decide how single and multi relation values will be stored.
- Persona: Database architect; avoid storage shortcuts that block future querying.
- Success Criteria: PROJECT_CONTEXT explains JSON value storage for single relations and a clear many-to-many/multi relation storage plan.
- Constraints: Planning only; no migration yet.
- Output: Relation storage architecture section.
- Strict Rule: Many-to-many must not be represented only as display text.
- Verify: Documentation review and standard verification.
- Commit: `Plan relation storage model`

#### T307 - Add Relation Migration Plan

- Version: `v2.1.6`
- Status: `completed`
- Goal: Document migration steps for relation storage without breaking existing entries.
- Persona: Migration engineer; protect existing local data.
- Success Criteria: Notes cover existing relation values, new multi relation values, and rollback risk.
- Constraints: Planning only.
- Output: Migration plan in PROJECT_CONTEXT or docs.
- Strict Rule: Do not run destructive migrations in this task.
- Verify: Documentation review and standard verification.
- Commit: `Plan relation migration`

#### T308 - Add Relation Test Fixtures

- Version: `v2.1.7`
- Status: `completed`
- Goal: Create reusable test helpers for schemas like Author, Article, Category, Tag, and Profile.
- Persona: Test engineer; make relation tests readable.
- Success Criteria: Tests can create common relation schemas without repeating large payloads.
- Constraints: Helpers only; no behavior change.
- Output: Test fixtures/helpers.
- Strict Rule: Helpers must not hide important relation assertions.
- Verify: Existing tests and standard verification.
- Commit: `Add relation test fixtures`

### Phase 2: Relation Validation And Storage

#### T309 - Validate Many-To-One Entry Values

- Version: `v2.2.0`
- Status: `completed`
- Goal: Validate `manyToOne` values when creating or updating entries.
- Persona: Data integrity engineer; ensure child entries point to valid parent entries.
- Success Criteria: Valid target entry id saves; missing/invalid target entry fails; required relation is enforced.
- Constraints: Keep non-relation fields unchanged.
- Output: Entry repository validation and tests.
- Strict Rule: Do not allow references to entries from the wrong target schema.
- Verify: Entry repository tests and standard verification.
- Commit: `Validate many to one values`

#### T310 - Validate One-To-One Entry Values

- Version: `v2.2.1`
- Status: `completed`
- Goal: Validate `oneToOne` values and prevent duplicate use when uniqueness is required.
- Persona: Data integrity engineer; preserve one-to-one meaning.
- Success Criteria: One source entry can point to one target entry; duplicate conflicting relation fails with a clear error.
- Constraints: Do not add UI behavior yet.
- Output: Entry validation and tests.
- Strict Rule: One-to-one must not behave like many-to-one.
- Verify: Entry repository tests and standard verification.
- Commit: `Validate one to one values`

#### T311 - Validate One-To-Many Entry Values

- Version: `v2.2.2`
- Status: `completed`
- Goal: Validate `oneToMany` values as arrays of target entry ids.
- Persona: Data integrity engineer; make parent-to-children relations explicit.
- Success Criteria: Array of valid target entries saves; non-array or wrong-schema ids fail.
- Constraints: No Admin UI changes yet.
- Output: Entry validation and tests.
- Strict Rule: Empty array is valid only when relation is not required.
- Verify: Entry repository tests and standard verification.
- Commit: `Validate one to many values`

#### T312 - Validate Many-To-Many Entry Values

- Version: `v2.2.3`
- Status: `completed`
- Goal: Validate `manyToMany` values as arrays of target entry ids.
- Persona: Data integrity engineer; make multi-select relation safe.
- Success Criteria: Valid tag-like arrays save; duplicates are normalized or rejected consistently; wrong-schema ids fail.
- Constraints: Keep storage minimal but explicit.
- Output: Entry validation and tests.
- Strict Rule: Do not store many-to-many as comma-separated strings.
- Verify: Entry repository tests and standard verification.
- Commit: `Validate many to many values`

#### T313 - Normalize Relation Values

- Version: `v2.2.4`
- Status: `completed`
- Goal: Normalize relation values before persistence.
- Persona: Repository engineer; keep stored data consistent.
- Success Criteria: Single relations store `string|null`; multi relations store stable arrays without duplicates.
- Constraints: Preserve existing primitive field behavior.
- Output: Normalization helper and tests.
- Strict Rule: Normalization must not create target entries.
- Verify: Unit tests and standard verification.
- Commit: `Normalize relation values`

#### T314 - Add Relation Readback Tests

- Version: `v2.2.5`
- Status: `completed`
- Goal: Verify relation values can be read back exactly after create and update.
- Persona: Regression test engineer; catch persistence mismatches.
- Success Criteria: Tests cover all four relation types after create/update/read.
- Constraints: Tests only unless a readback bug is found.
- Output: Repository/API tests.
- Strict Rule: Do not skip any relation type.
- Verify: Target tests and standard verification.
- Commit: `Test relation readback`

#### T315 - Add Relation Delete Guard

- Version: `v2.2.6`
- Status: `completed`
- Goal: Decide and implement delete behavior when a target entry is referenced.
- Persona: Data safety engineer; prevent broken relations.
- Success Criteria: Deleting referenced entries is blocked or relations are cleared according to documented MVP rule.
- Constraints: Choose conservative behavior and document it.
- Output: Delete guard and tests.
- Strict Rule: Do not leave dangling relation ids.
- Verify: Delete tests and standard verification.
- Commit: `Add relation delete guard`

#### T316 - Add Relation Schema Delete Guard

- Version: `v2.2.7`
- Status: `completed`
- Goal: Prevent deleting schemas that are used as relation targets unless safe.
- Persona: Data safety engineer; protect content models.
- Success Criteria: Schema delete fails with a clear error when another schema references it.
- Constraints: Preserve delete for schemas with no dependents.
- Output: Schema delete guard and tests.
- Strict Rule: Do not orphan relation field definitions.
- Verify: Schema route/repository tests and standard verification.
- Commit: `Add relation schema delete guard`

#### T317 - Add Relation Update Migration Safety

- Version: `v2.2.8`
- Status: `pending`
- Goal: Handle relation field edits safely when entries already exist.
- Persona: Migration safety engineer; avoid invalidating existing content silently.
- Success Criteria: Changing relation target/type is blocked or clearly validated when existing entries use the field.
- Constraints: No destructive automatic rewrite.
- Output: Schema update guard and tests.
- Strict Rule: Existing relation data must not be silently corrupted.
- Verify: Schema update tests and standard verification.
- Commit: `Add relation update safety`

#### T318 - Add Relation Repository Helpers

- Version: `v2.2.9`
- Status: `pending`
- Goal: Add focused helpers for finding relation references and target entries.
- Persona: Repository maintainer; reduce duplicated relation lookup logic.
- Success Criteria: Helpers are small, typed, and used by validation/delete/populate code.
- Constraints: Avoid broad refactors.
- Output: Relation helper module and tests.
- Strict Rule: Keep helper file below 250 lines.
- Verify: Unit tests and standard verification.
- Commit: `Add relation repository helpers`

#### T319 - Relation Storage Gate

- Version: `v2.2.10`
- Status: `pending`
- Goal: Verify all relation validation/storage tasks together.
- Persona: Release engineer; stop before API/UI work if data layer is weak.
- Success Criteria: All relation repository tests pass and existing smoke flow still passes.
- Constraints: No new feature work unless fixing storage blockers.
- Output: Data-layer checkpoint docs.
- Strict Rule: Do not proceed with UI tasks if relation storage is failing.
- Verify: Standard verification plus focused relation tests.
- Commit: `Verify relation storage`

### Phase 3: Relation APIs And Populate

#### T320 - Return Relation Metadata In Schema APIs

- Version: `v2.3.0`
- Status: `pending`
- Goal: Ensure schema API responses include relation type and target schema metadata.
- Persona: API contract engineer; make Admin UI able to render relation controls.
- Success Criteria: Schema list/read responses include enough relation metadata for UI forms.
- Constraints: Do not expose internal-only fields.
- Output: Schema API response updates and tests.
- Strict Rule: Existing clients must still understand non-relation fields.
- Verify: Schema API tests and standard verification.
- Commit: `Expose relation metadata`

#### T321 - Add Relation-Aware Entry API Validation

- Version: `v2.3.1`
- Status: `pending`
- Goal: Ensure admin entry APIs return clear relation validation errors.
- Persona: API engineer; make request failures actionable.
- Success Criteria: Create/update admin entry routes reject invalid relation payloads with stable errors.
- Constraints: Reuse repository validation.
- Output: Entry route tests.
- Strict Rule: Do not duplicate validation logic in routes.
- Verify: Entry API tests and standard verification.
- Commit: `Validate relation entry APIs`

#### T322 - Add Dynamic API Relation Validation

- Version: `v2.3.2`
- Status: `pending`
- Goal: Ensure dynamic content APIs validate relation payloads for create/update.
- Persona: Public API engineer; keep generated APIs consistent with admin APIs.
- Success Criteria: Dynamic create/update accepts valid relation payloads and rejects invalid ones.
- Constraints: Preserve RBAC checks.
- Output: Content route tests.
- Strict Rule: Permission checks must still run before writes.
- Verify: Content route tests and standard verification.
- Commit: `Validate dynamic relation APIs`

#### T323 - Add Basic Relation Populate

- Version: `v2.3.3`
- Status: `pending`
- Goal: Add `?populate=relations` for one-level relation expansion.
- Persona: API consumer advocate; reduce extra client round trips.
- Success Criteria: Dynamic read/list can return related entries for relation fields.
- Constraints: One-level populate only; no recursive deep populate.
- Output: Populate service and tests.
- Strict Rule: Populate must not ignore RBAC behavior.
- Verify: Content API tests and standard verification.
- Commit: `Add relation populate`

#### T324 - Add Populate All Alias

- Version: `v2.3.4`
- Status: `pending`
- Goal: Support `?populate=all` and `?populate=*` aliases.
- Persona: API ergonomics engineer; make developer usage predictable.
- Success Criteria: Aliases behave the same as relation populate for current MVP.
- Constraints: Do not add media populate in this task unless already supported.
- Output: Query parsing tests.
- Strict Rule: Unknown populate values must not crash the server.
- Verify: Content API tests and standard verification.
- Commit: `Add populate aliases`

#### T325 - Add Relation Response Shape Docs

- Version: `v2.3.5`
- Status: `pending`
- Goal: Document raw relation ids vs populated relation response shapes.
- Persona: API documentation writer; prevent client confusion.
- Success Criteria: `/doc` and `/readme` show request and response examples.
- Constraints: Docs only unless examples expose a bug.
- Output: Static docs updates.
- Strict Rule: Examples must match actual API routes.
- Verify: Browser `/doc` and `/readme`; standard verification.
- Commit: `Document relation responses`

#### T326 - Add Relation API Explorer Examples

- Version: `v2.3.6`
- Status: `pending`
- Goal: Show relation request payloads and populate examples in Admin UI API Explorer.
- Persona: Developer experience engineer; make generated relation APIs inspectable.
- Success Criteria: API Explorer shows relation field payload examples for single and multi relations.
- Constraints: Use existing Admin UI stack.
- Output: API Explorer updates.
- Strict Rule: Examples must be generated from schema metadata.
- Verify: Browser API Explorer with relation schema; standard verification.
- Commit: `Show relation API examples`

#### T327 - Add RBAC Populate Tests

- Version: `v2.3.7`
- Status: `pending`
- Goal: Verify populated relation APIs respect role permissions.
- Persona: Security-minded API tester; avoid leaking blocked content through populate.
- Success Criteria: Allowed role can populate allowed schema; blocked role cannot read blocked content.
- Constraints: Preserve current owner bypass behavior.
- Output: RBAC content route tests.
- Strict Rule: Populate must not bypass permission denial.
- Verify: RBAC tests, smoke, standard verification.
- Commit: `Test RBAC relation populate`

#### T328 - Relation API Gate

- Version: `v2.3.8`
- Status: `pending`
- Goal: Verify relation APIs, populate, docs examples, and RBAC behavior together.
- Persona: Release engineer; checkpoint API layer before UI work.
- Success Criteria: Manual API flow creates relation schemas, entries, populates relations, and verifies blocked role.
- Constraints: No new feature work unless fixing API blockers.
- Output: API checkpoint notes.
- Strict Rule: Do not mark complete without manual API/RBAC verification.
- Verify: Standard verification plus manual relation API/RBAC flow.
- Commit: `Verify relation APIs`

### Phase 4: Admin UI Schema Relation Builder

#### T329 - Add Relation Type Picker

- Version: `v2.4.0`
- Status: `pending`
- Goal: Add relation type picker to the schema field builder.
- Persona: CMS builder UI engineer; make relation kind explicit.
- Success Criteria: Relation fields can choose one-to-one, one-to-many, many-to-one, or many-to-many.
- Constraints: Do not change entry UI yet.
- Output: Schema builder UI updates.
- Strict Rule: Relation type must not default silently without visible UI.
- Verify: Browser schema builder desktop/mobile; standard verification.
- Commit: `Add relation type picker`

#### T330 - Improve Target Schema Picker

- Version: `v2.4.1`
- Status: `pending`
- Goal: Improve target schema selection for relation fields.
- Persona: CMS builder UI engineer; prevent invalid relation setup.
- Success Criteria: Target picker lists existing schemas, shows empty state, and blocks save without target.
- Constraints: Use existing schema APIs.
- Output: Target picker UI.
- Strict Rule: User must not type raw target schema ids manually when picker data exists.
- Verify: Browser relation target flow; standard verification.
- Commit: `Improve relation target picker`

#### T331 - Show Relation Direction Hints

- Version: `v2.4.2`
- Status: `pending`
- Goal: Add concise UI hints explaining relation direction.
- Persona: Product explainer; help users choose the right relation.
- Success Criteria: Each relation type has short English + Hinglish guidance.
- Constraints: No large tutorial panel.
- Output: Field builder helper copy.
- Strict Rule: UI copy must match backend semantics.
- Verify: Browser schema builder check; standard verification.
- Commit: `Add relation direction hints`

#### T332 - Display Relation Fields In Schema Details

- Version: `v2.4.3`
- Status: `pending`
- Goal: Show relation type and target schema in selected schema details.
- Persona: Admin operator; make existing content model easy to inspect.
- Success Criteria: Schema details clearly show relation kind and target for every relation field.
- Constraints: No edit behavior changes unless already available.
- Output: Schema detail UI update.
- Strict Rule: Do not hide target schema ids when target names are unavailable.
- Verify: Browser schema detail check; standard verification.
- Commit: `Show relation field details`

#### T333 - Add Relation Edit Safety UI

- Version: `v2.4.4`
- Status: `pending`
- Goal: Warn before editing relation type or target on fields with existing entries.
- Persona: Data safety UI engineer; prevent accidental model damage.
- Success Criteria: UI explains why unsafe relation edits may be blocked by backend.
- Constraints: Backend remains source of truth.
- Output: Schema edit warning UI.
- Strict Rule: UI must not promise edits that backend blocks.
- Verify: Browser schema edit flow; standard verification.
- Commit: `Add relation edit warnings`

#### T334 - Add Relation Schema Creation Flow Test

- Version: `v2.4.5`
- Status: `pending`
- Goal: Verify schema builder can create schemas using every relation type.
- Persona: Browser QA engineer; catch form regressions.
- Success Criteria: Browser or UI test covers one-to-one, one-to-many, many-to-one, and many-to-many creation.
- Constraints: Keep tests maintainable.
- Output: Browser/manual test notes or automated UI test if available.
- Strict Rule: Do not skip mobile check.
- Verify: Browser desktop/mobile plus standard verification.
- Commit: `Test relation schema UI`

#### T335 - Add Relation Schema Copy Examples

- Version: `v2.4.6`
- Status: `pending`
- Goal: Add copyable relation schema examples in Admin UI docs area.
- Persona: Builder enablement writer; speed up setup for common models.
- Success Criteria: Examples include Author-Article, Article-Category, Article-Tags, and User-Profile.
- Constraints: UI docs only.
- Output: Admin Docs page updates.
- Strict Rule: Examples must match current field payload shape.
- Verify: Browser Admin Docs check; standard verification.
- Commit: `Add relation schema examples`

#### T336 - Polish Relation Builder Mobile Layout

- Version: `v2.4.7`
- Status: `pending`
- Goal: Ensure relation builder controls fit and remain usable on mobile.
- Persona: Responsive UI engineer; avoid cramped forms.
- Success Criteria: Relation type picker, target picker, and hints fit at mobile width without overlap.
- Constraints: CSS/markup only unless fixing accessibility.
- Output: Responsive UI polish.
- Strict Rule: Do not use viewport-scaled fonts.
- Verify: Browser mobile screenshot/check; standard verification.
- Commit: `Polish relation builder mobile`

#### T337 - Schema Builder Relation Gate

- Version: `v2.4.8`
- Status: `pending`
- Goal: Verify relation schema builder end-to-end before entry UI work.
- Persona: Release engineer; checkpoint builder quality.
- Success Criteria: Owner can create relation schemas of all four types in Admin UI.
- Constraints: No new feature work unless fixing builder blockers.
- Output: Builder checkpoint docs.
- Strict Rule: Do not proceed if relation schema creation fails in browser.
- Verify: Browser desktop/mobile plus standard verification.
- Commit: `Verify relation builder`

### Phase 5: Entry UI Relation Editing

#### T338 - Add Single Relation Entry Picker

- Version: `v2.5.0`
- Status: `pending`
- Goal: Render single relation fields as target-entry pickers in entry forms.
- Persona: Content editor UI engineer; avoid raw id typing.
- Success Criteria: one-to-one and many-to-one fields show selectable target entries.
- Constraints: Use existing entry APIs.
- Output: Entry form single relation picker.
- Strict Rule: Do not require editors to type entry ids manually.
- Verify: Browser entry create/edit flow; standard verification.
- Commit: `Add single relation picker`

#### T339 - Add Multi Relation Entry Picker

- Version: `v2.5.1`
- Status: `pending`
- Goal: Render multi relation fields as multi-select target-entry pickers.
- Persona: Content editor UI engineer; support one-to-many and many-to-many editing.
- Success Criteria: Editors can select, remove, and save multiple related entries.
- Constraints: Keep UI simple; no drag ordering yet.
- Output: Entry form multi relation picker.
- Strict Rule: Multi relation values must save as arrays.
- Verify: Browser multi relation create/edit flow; standard verification.
- Commit: `Add multi relation picker`

#### T340 - Add Relation Entry Labels

- Version: `v2.5.2`
- Status: `pending`
- Goal: Display human-readable labels for related entries.
- Persona: Content editor; make relation choices understandable.
- Success Criteria: Picker options use a sensible title/name/id fallback.
- Constraints: No search API yet unless already available.
- Output: Relation label helper.
- Strict Rule: Do not show blank options.
- Verify: Browser entry picker check; standard verification.
- Commit: `Add relation entry labels`

#### T341 - Add Required Relation UI Validation

- Version: `v2.5.3`
- Status: `pending`
- Goal: Validate required relation fields in the Admin UI before submit.
- Persona: Form UX engineer; catch obvious errors early.
- Success Criteria: Required single and multi relation fields show clear errors before save.
- Constraints: Backend validation remains source of truth.
- Output: Entry form validation update.
- Strict Rule: UI validation must not contradict backend validation.
- Verify: Browser validation flow; standard verification.
- Commit: `Validate required relation UI`

#### T342 - Show Relation Values In Entry List

- Version: `v2.5.4`
- Status: `pending`
- Goal: Show relation summaries in entry lists.
- Persona: Content editor; make list scanning useful.
- Success Criteria: Entry list shows related entry labels/counts without overflowing.
- Constraints: Avoid expensive deep populate.
- Output: Entry list relation display.
- Strict Rule: Long relation lists must not break layout.
- Verify: Browser desktop/mobile entry list; standard verification.
- Commit: `Show relation entry summaries`

#### T343 - Add Relation Edit Roundtrip Browser Check

- Version: `v2.5.5`
- Status: `pending`
- Goal: Verify relation values survive create, edit, save, and reload in Admin UI.
- Persona: Browser QA engineer; protect editor workflow.
- Success Criteria: Browser check covers single and multi relation fields.
- Constraints: Test/check only unless a bug is found.
- Output: Browser verification notes or test.
- Strict Rule: Do not mark complete without reload check.
- Verify: Browser roundtrip plus standard verification.
- Commit: `Test relation entry roundtrip`

#### T344 - Entry Relation UI Gate

- Version: `v2.5.6`
- Status: `pending`
- Goal: Verify relation entry UI with all relation types before docs/release work.
- Persona: Release engineer; checkpoint editor workflow.
- Success Criteria: Admin UI can create and edit entries using all four relation types.
- Constraints: No new feature work unless fixing entry UI blockers.
- Output: Entry UI checkpoint notes.
- Strict Rule: Do not skip mobile verification.
- Verify: Browser desktop/mobile plus standard verification.
- Commit: `Verify relation entry UI`

### Phase 6: Docs, CLI, QA, And Release

#### T345 - Sync Static Relation Docs

- Version: `v2.6.0`
- Status: `pending`
- Goal: Sync `/doc` and `/readme` with completed relation behavior.
- Persona: Documentation maintainer; keep docs aligned with product.
- Success Criteria: Docs explain relation types, payloads, populate, Admin UI flow, and common errors in English + Hinglish.
- Constraints: Docs must be generated through `packages/docs`.
- Output: Static docs content updates.
- Strict Rule: Do not document future features as completed.
- Verify: Browser `/doc` and `/readme`; standard verification.
- Commit: `Sync relation docs`

#### T346 - Update Root Project Context For Relations

- Version: `v2.6.1`
- Status: `pending`
- Goal: Update README and PROJECT_CONTEXT with Task 3 relation capabilities.
- Persona: Project maintainer; keep high-level context accurate.
- Success Criteria: Root docs mention relation types, populate, UI support, and verification expectations.
- Constraints: Documentation only.
- Output: README and PROJECT_CONTEXT updates.
- Strict Rule: Keep English + Hinglish where user-facing.
- Verify: Documentation review and standard verification.
- Commit: `Update relation project context`

#### T347 - Update create-apiagex Relation Starter Notes

- Version: `v2.6.2`
- Status: `pending`
- Goal: Add relation modeling notes to the scaffold CLI README/starter docs.
- Persona: Package author; help new projects understand relation setup.
- Success Criteria: Generated starter docs mention relation examples and `/doc` path.
- Constraints: Do not expand CLI into a full wizard in this task.
- Output: create-apiagex README/starter docs update.
- Strict Rule: CLI must still refuse non-empty folders.
- Verify: CLI tests, dry-run, standard verification.
- Commit: `Update relation starter docs`

#### T348 - Add Relation Smoke Test

- Version: `v2.6.3`
- Status: `pending`
- Goal: Add a focused smoke test covering relation schema, entries, populate, and RBAC allow/block.
- Persona: Release test engineer; protect the full relation path.
- Success Criteria: Smoke covers relation create/read/populate and blocked role behavior.
- Constraints: Keep existing smoke fast.
- Output: Smoke test update or additional relation smoke file.
- Strict Rule: Smoke must use isolated in-memory database.
- Verify: `npm run smoke` and standard verification.
- Commit: `Add relation smoke test`

#### T349 - Add Manual Relation QA Checklist

- Version: `v2.6.4`
- Status: `pending`
- Goal: Add a manual QA checklist for relation modeling and editing.
- Persona: QA lead; make release verification repeatable.
- Success Criteria: Checklist covers schema relation types, entry pickers, populate, docs, mobile, and RBAC.
- Constraints: Documentation only.
- Output: QA checklist update.
- Strict Rule: Checklist must include expected allowed and blocked outcomes.
- Verify: Documentation review and standard verification.
- Commit: `Add relation QA checklist`

#### T350 - Release Apiagex Task 3

- Version: `v3.0.0`
- Status: `pending`
- Goal: Final Task 3 release gate for relation modeling.
- Persona: Release engineer; only release what is verified.
- Success Criteria: Standard verification passes, relation smoke passes, browser checks cover `/adminui`, `/doc`, `/readme`, and manual API/RBAC relation flow passes.
- Constraints: No new feature work unless required to fix release blockers.
- Output: Task 3 release checkpoint update.
- Strict Rule: Do not mark complete with skipped browser checks unless the user explicitly accepts the risk.
- Verify: Standard verification, Browser checks desktop/mobile, `/doc`, `/readme`, manual relation API/RBAC flow.
- Commit: `Release Apiagex task 3`
