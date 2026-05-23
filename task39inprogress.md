# Apiagex Task 39 In Progress - Complete Schema Field Types

Task 39 completes the field-type set needed for AI-generated projects and Admin UI schema design.

Hinglish: Is task ka goal hai ki user/Admin UI/AI/MCP sab same rich field types samjhe aur backend entry validation bhi wahi enforce kare.

## Queue Rules

- Keep schema metadata additive and provider-compatible for SQLite, MySQL, and PostgreSQL.
- Reuse the existing `fields.options_json` metadata for option-based fields.
- Keep uploaded binary files out of project-template JSON unless an explicit asset export task is added later.
- Do not commit generated media files, tokens, or `project-test` output.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

### T3901 - Add Missing Primitive Field Types

- Version: `v0.8.28`
- Status: `completed`
- Goal: Add `email`, `url`, `integer`, `decimal`, `currency`, `datetime`, `time`, `password`, and `richText`.
- Success Criteria: Schema builder accepts the field types, entry forms render appropriate controls, backend validates values, OpenAPI/typegen/MCP/AI contracts expose them, and tests cover valid/invalid data.
- Output: Database/server/admin/typegen/OpenAPI/docs/tests.
- Strict Rule: `password` is a hidden string field only; automatic hashing remains a workflow/auth task.
- Verify: Focused database/server/admin tests, build.
- Commit: `Add primitive schema field types`

Result:

- Added backend/admin/typegen/OpenAPI/MCP support for `email`, `url`, `integer`, `decimal`, `currency`, `datetime`, `time`, `password`, and `richText`.
- Entry validation now rejects invalid email, non-HTTP URLs, decimal values in `integer`, invalid date-time values, and invalid time values.
- Admin entry forms use matching controls: email, URL, numeric steps, datetime-local, time, password, and larger rich text textarea.
- `password` remains a hidden string field; hashing/verification stays in workflow password nodes or custom code.

### T3902 - Add MultiSelect Field Type

- Version: `v0.8.29`
- Status: `completed`
- Goal: Add an option-based `multiSelect` field that stores an array of selected strings.
- Success Criteria: Options are required, backend validates every selected value, Admin UI renders a multi-select control, OpenAPI/typegen emit string arrays with enum items, and AI/MCP can create the field.
- Output: Shared option metadata support, UI, tests, docs.
- Strict Rule: `multiSelect` should not be confused with relation fields; it stores fixed strings, not entry ids.
- Verify: Focused database/server/admin tests, build.
- Commit: `Add multiselect schema field type`

Result:

- Added `multiSelect` as an option-based field type.
- Reused `fields.options_json` metadata.
- Admin schema builder can configure options.
- Admin entry form renders a multi-select control.
- Backend stores string arrays, validates every selected value, and deduplicates repeated selections.
- OpenAPI emits a string array with enum items; typegen emits literal union arrays.

### T3903 - Split Media Into File And Image Field Types

- Version: `v0.8.30`
- Status: `completed`
- Goal: Add `file` and `image` field aliases on top of schema-scoped media uploads.
- Success Criteria: Entry APIs accept file/image uploads through `mediaUploads`, files save under `/uploads/{schemaSlug}/{fieldSlug}/...`, `image` rejects non-image uploads, and Admin UI shows matching accept filters.
- Output: Server validation, Admin UI controls, docs/tests.
- Strict Rule: Keep existing `media` compatible.
- Verify: Focused server/admin tests, build.
- Commit: `Add file and image field types`

Result:

- Added `file` and `image` field types while keeping `media` compatible.
- Entry `mediaUploads` now accepts `media`, `file`, and `image` field slugs.
- `file` and `media` allow PNG, JPEG, GIF, WebP, and PDF.
- `image` allows only PNG, JPEG, GIF, and WebP.
- Uploaded files are stored under `/uploads/{schemaSlug}/{fieldSlug}/...` and saved as URL strings.

### T3904 - Document Field Type Matrix

- Version: `v0.8.31`
- Status: `completed`
- Goal: Update docs with storage shape, validation, Admin UI controls, OpenAPI, generated TypeScript, and AI guidance for every field type.
- Success Criteria: README and field roadmap clearly show current vs future behavior.
- Output: Docs.
- Strict Rule: Do not imply password hashing or binary template export exists when it does not.
- Verify: Documentation review.
- Commit: `Document complete field type matrix`

Result:

- Updated README/docs with the complete field type list.
- Updated AI plan docs so AI/MCP-created schemas can use the new types.
- Updated the field type roadmap into a current field matrix.

### T3905 - Release Field Type Completeness

- Version: `v0.8.32`
- Status: `pending`
- Goal: Publish completed field-type improvements.
- Success Criteria: Release checks pass, changelog/tag/release notes explain exact behavior, npm publish succeeds with maintainer approval.
- Output: Published packages and verification notes.
- Strict Rule: Never publish if release checks fail.
- Verify: `npm view` and GitHub Actions.
- Commit: `Release field type completeness`
