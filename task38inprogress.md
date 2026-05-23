# Apiagex Task 38 In Progress - Schema Field Completeness And Media Uploads

Task 38 focuses on schema field completeness and media handling. The immediate missing field was an enum/select type. Media now uses one central upload engine with schema-scoped folders, not one separate upload table/system per schema.

Task 38 ka focus schema field types complete karna aur media upload ko proper central system banana tha. Ab `media` field entry create/update ke same call me upload accept karta hai aur URL/path string save hota hai.

## Current Media Behavior

- `media` is a schema field type that stores URL strings.
- Entry UI shows a URL input plus an upload control.
- Entry create/update accepts `mediaUploads` and stores files under `/uploads/{schemaSlug}/{fieldSlug}/...`.
- Direct `POST /api/admin/media` upload also exists for upload-first/attach-later use cases.
- Har schema ka separate media system nahi hai. Design: one central upload engine, schema/field scoped folders.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run focused tests plus standard verification where practical.
- Mark tasks `completed` only after tests/docs pass.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep schema metadata additive and provider compatible for SQLite, MySQL, and PostgreSQL.
- Do not commit generated media files, tokens, or project-test output.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

### Phase 1: Field Metadata Foundation

#### T3801 - Add Enum Select Field Type

- Version: `v0.8.22`
- Status: `completed`
- Goal: Add a schema field type for fixed allowed values.
- Success Criteria: Admin schema builder can define enum options, entry form renders a select, backend validates values, OpenAPI/typegen/MCP/AI contracts understand enum, and project template export/import preserves options.
- Output: Database field metadata, backend validation, Admin UI support, tests, docs.
- Strict Rule: Existing databases must migrate additively.
- Verify: Focused database/server/admin tests, build.
- Commit: `Add enum field type`

Result:

- Added `enum` as a first-class schema field type.
- Added additive `fields.options_json` storage for enum options.
- Admin UI schema builder can enter one option per line.
- Admin UI entry form renders enum fields as select controls.
- Backend validates enum values against allowed options.
- OpenAPI dynamic schemas emit enum values.
- Typegen emits string-literal unions for enum fields.
- MCP and AI plan schema creation contracts accept enum options.
- Project template export/import preserves enum options.
- Fixed AdminFieldDraft OpenAPI enum to include `longText`.

Verification:

- `npm run check`
- `npm run smoke`
- `npm audit --audit-level=high`
- `git diff --check`

#### T3802 - Audit Missing Primitive Field Types

- Version: `v0.8.23`
- Status: `completed`
- Goal: Decide exact support for email, URL, integer, decimal, datetime, time, and multi-select.
- Success Criteria: Product contract documents storage shape, validation rules, UI controls, OpenAPI mapping, and AI/MCP behavior.
- Output: Docs/task update first; implementation in later tasks.
- Strict Rule: Do not add overlapping types without clear validation semantics.
- Verify: Documentation review.
- Commit: `Plan remaining field types`

Result:

- Added `docs/schema-field-type-roadmap.md`.
- Planned email, URL, integer, decimal, datetime, time, and multiSelect.
- Clarified which types should stay validation modes vs separate field types.
- Kept media upload/picker separate because it needs central file storage and serving.

### Phase 2: Central Media System

#### T3803 - Add Central Media Upload API

- Version: `v0.8.24`
- Status: `completed`
- Goal: Add a secure central upload endpoint and static serving for uploaded files.
- Success Criteria: Admin-authenticated upload route stores files under configured uploads path, returns URL/metadata, validates size/type, and serves safe public URLs.
- Output: Server route, tests, docs.
- Strict Rule: Do not allow path traversal or executable file serving surprises.
- Verify: Server tests and smoke.
- Commit: `Add media upload API`

Result:

- Added `POST /api/admin/media` for central base64 media uploads.
- Files are stored in the configured uploads path and served from `/uploads/...`.
- Allowed file types: PNG, JPEG, GIF, WebP, PDF.
- Upload response returns id, sanitized filename, content type, size, and URL.
- `/api` path catalog now includes `/uploads`.
- OpenAPI docs include Admin Media upload request/response.
- Added server tests for upload, public serving, and rejection of unsupported uploads.

#### T3804 - Add Admin UI Media Picker

- Version: `v0.8.25`
- Status: `completed`
- Goal: Let users upload/pick media from entry forms.
- Success Criteria: Media field offers upload, preview, replace, and clear controls; saved entry value remains URL/id contract from media API.
- Output: Admin UI, tests, browser checks.
- Strict Rule: Media UI must not block plain URL entry for external assets.
- Verify: Admin UI tests and browser desktop/mobile.
- Commit: `Add media picker UI`

Result:

- Media entry fields now show a URL input plus an upload control.
- Upload files are now sent with the schema entry create/update request as `mediaUploads`.
- Server stores those files under `/uploads/{schemaSlug}/{fieldSlug}/...`.
- Returned `/uploads/...` URL is saved into entry data automatically.
- Manual external URL/path entry still works.
- Added Admin UI test for upload-to-entry-save flow.

#### T3805 - Include Media In Project Templates

- Version: `v0.8.26`
- Status: `completed`
- Goal: Decide and implement safe template behavior for media references.
- Success Criteria: Project template export/import preserves schema media field metadata and clearly handles asset files vs URL references.
- Output: Template contract/docs/tests.
- Strict Rule: Do not silently export private/local binary files without explicit user action.
- Verify: Template tests.
- Commit: `Document media template behavior`

Result:

- Documented that project templates preserve schema media fields and URL/string references.
- Documented that uploaded binary files are not silently bundled into JSON templates.
- Existing project template export/import already preserves `media` field definitions through the `fields` table.

### Phase 3: Release

#### T3806 - Release Field And Media Improvements

- Version: `v0.8.27`
- Status: `pending`
- Goal: Publish completed field/media slices.
- Success Criteria: Release checks pass, changelog/tag/release notes explain exact field/media behavior, npm publish succeeds with maintainer approval.
- Output: Published packages and verification notes.
- Strict Rule: Never publish if release checks fail.
- Verify: `npm view` and GitHub Actions.
- Commit: `Release schema field improvements`
