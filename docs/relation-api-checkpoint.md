# Relation API Checkpoint

T328 verifies the Task 3 API layer before Admin UI relation-builder work starts.

## Manual Flow

- Created an `Author T328` schema through `POST /api/admin/schemas`.
- Created a `Book T328` schema with a required `manyToOne` `author` relation field.
- Created an author entry through `POST /api/content/:authorSlug`.
- Created a book entry through `POST /api/content/:bookSlug` using the raw author entry id.
- Read the book through `GET /api/content/:bookSlug/:entryId?populate=relations`.
- Verified `data.author` populated to the related entry object and preserved the author data.
- Created a blocked role with no schema get permission.
- Verified the blocked role receives `API_PERMISSION_DENIED` on the populated read request.

## Result

- Relation schema metadata works for API-created schemas.
- Raw relation payloads save as entry ids.
- One-level `populate=relations` resolves related entries.
- RBAC still blocks source schema reads before populate can expose content.
- Standard verification must remain green before Phase 4 UI work.
