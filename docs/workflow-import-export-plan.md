# Workflow Import Export Plan

This document defines the planned workflow import/export system for templates, backups, sharing, and future marketplace workflows.

Ye plan workflow JSON ko safe tarike se export/import karne ke liye hai. Secret values export me kabhi nahi jayengi.

## Goals

Support:

- Backup a workflow.
- Move workflow between environments.
- Share starter templates.
- Import future official templates.
- Compare workflow versions in code review.

## Non-goals

- No secret value export.
- No automatic production activation on import.
- No arbitrary JavaScript import.
- No bypass of Custom API Permissions.
- No silent schema creation in MVP unless explicitly requested later.

## Export Package Shape

Recommended package:

```json
{
  "kind": "apiagex.workflow.export",
  "exportVersion": 1,
  "apiagexVersion": "0.16.x",
  "exportedAt": "2026-05-20T00:00:00.000Z",
  "workflow": {
    "name": "Product lookup",
    "description": "Query products by search term.",
    "method": "POST",
    "path": "/products/lookup",
    "active": false,
    "definition": {
      "version": 1,
      "route": { "method": "POST", "path": "/products/lookup" },
      "startNodeId": "start",
      "nodes": [],
      "edges": []
    }
  },
  "dependencies": {
    "schemas": ["products"],
    "secrets": ["secret:provider.apiKey"],
    "roles": []
  },
  "notes": []
}
```

Exports should be stable JSON:

- Consistent key order where practical.
- Two-space indentation.
- No database ids unless explicitly useful as metadata.
- No run history by default.

## Versioning

There are two versions:

```txt
exportVersion
workflow.definition.version
```

`exportVersion` controls the package envelope.

`workflow.definition.version` controls runtime workflow JSON compatibility.

Import rules:

- Same version imports normally.
- Older compatible versions can be migrated.
- Newer unknown versions are rejected with `WORKFLOW_IMPORT_VERSION_UNSUPPORTED`.
- Import should include a dry-run validation mode.

## Validation

Import must validate before saving:

- Package `kind` is correct.
- `exportVersion` is supported.
- Workflow method/path are safe.
- Workflow definition passes existing workflow validation.
- Node types are supported.
- Required schema slugs exist or are reported as missing.
- Secret references are present only as references, not values.
- Route conflict is reported before write.
- Imported workflow is inactive by default unless explicitly overridden by an admin.

Dry-run output:

```json
{
  "ok": true,
  "canImport": true,
  "warnings": [
    "Schema products exists.",
    "Secret secret:provider.apiKey must be configured before activation."
  ]
}
```

## Secret Exclusion

Strict rule:

```txt
Export must never include secret values.
```

Allowed:

```json
{
  "secrets": ["secret:stripe.secretKey"]
}
```

Not allowed:

```json
{
  "stripeSecretKey": "sk_live_real_value"
}
```

Export scanner should reject suspicious values in sensitive locations:

- `authorization`
- `apiKey`
- `secret`
- `token`
- `password`
- `clientSecret`
- `accessToken`
- `refreshToken`

If a value starts with `secret:`, it is a reference and can be exported.

Hinglish: export me sirf secret ka naam/reference jayega. Real key/value nahi jayega.

## Compatibility

Compatibility checks should report:

- Missing schemas.
- Missing fields used by templates.
- Missing secret references.
- Unsupported node types.
- Unsupported workflow definition version.
- Route conflicts.
- Permission not configured.

Import should not automatically allow Custom API Permissions. Imported workflows remain blocked until admin allows public or a content API role.

## Import Modes

### Dry run

Validates and reports issues without saving.

### Save inactive

Creates workflow as inactive. This should be the default.

### Replace existing

Requires explicit workflow id or matching method/path and confirmation.

### Duplicate

Creates a new workflow with a new path or suffix.

## Admin UI Flow

Settings > Workflows should later include:

- Export button per workflow.
- Import workflow button.
- Dry-run validation screen.
- Dependency checklist.
- Route conflict resolution.
- Secret reference checklist.
- Save inactive by default.

Import summary example:

```txt
Workflow: Product lookup
Route: POST /api/custom/products/lookup
Schemas: products found
Secrets: secret:provider.apiKey missing
Status after import: inactive
```

## API Flow

Planned Admin APIs:

```txt
GET  /api/admin/workflows/:workflowId/export
POST /api/admin/workflows/import/validate
POST /api/admin/workflows/import
```

All require Admin/control-plane permission.

## Template Marketplace Safety

Future shared templates should include:

- Human-readable description.
- Required schemas.
- Required secrets.
- Security notes.
- Minimum Apiagex version.
- No active-by-default flag.
- No embedded credentials.

Marketplace imports must be treated as untrusted input and validated like user uploads.

## Testing Plan

Minimum tests:

- Export omits database ids that should not travel.
- Export keeps secret references but excludes values.
- Import dry-run catches missing schema.
- Import dry-run catches missing secret reference.
- Import rejects unsupported version.
- Import rejects unknown node type.
- Import save creates inactive workflow.
- Import replace requires explicit confirmation.
- Exported workflow can be re-imported and executed after dependencies exist.

## Implementation Order

1. Add export serializer with stable JSON shape.
2. Add secret-reference scanner.
3. Add import validator with dry-run mode.
4. Add import repository workflow save path.
5. Add Admin APIs.
6. Add Admin UI import/export controls.
7. Add docs and examples.
8. Add provider tests for import/export persistence.

Do not ship marketplace-style sharing until secret exclusion and compatibility validation are covered by tests.
