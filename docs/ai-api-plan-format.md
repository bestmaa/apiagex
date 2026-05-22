# AI API Plan Format

Apiagex AI plans are machine-readable previews for AI-created backend changes. A plan can describe schemas, workflow APIs, permissions, seed data, and test calls before anything is applied.

Hinglish: AI pehle plan banayega, phir preview/apply hoga. Raw secret plan me kabhi nahi aayega.

## Shape

```json
{
  "version": 1,
  "title": "Product search API",
  "summary": "Create product schema and search workflow.",
  "operations": [
    {
      "id": "schema.products",
      "kind": "createSchema",
      "reason": "Frontend needs product records.",
      "schema": {
        "name": "Products",
        "slug": "products",
        "fields": [
          { "name": "Name", "slug": "name", "type": "text", "required": true },
          { "name": "Price", "slug": "price", "type": "number" }
        ]
      }
    }
  ],
  "tests": [
    {
      "id": "health",
      "method": "GET",
      "path": "/api/health",
      "expectedStatus": 200
    }
  ],
  "notes": ["Do not commit APIAGEX_AUTOMATION_TOKEN."]
}
```

## Operation Kinds

- `createSchema`: additive schema creation with ordered fields.
- `createWorkflowApi`: create a workflow-backed route under `/api/custom`.
- `setPermission`: allow or block one route for one API role.
- `seedData`: optional sample entries for a schema.

## Safety Rules

- Plans must not include raw tokens, owner passwords, provider API keys, cookies, or bearer headers.
- Plans should prefer inactive workflows unless the user explicitly asks for active routes.
- Public access must be explicit in the plan reason.
- Destructive operations are intentionally absent from v1.
- Apply APIs must report skipped operations instead of overwriting existing matching resources.

## Preview And Apply APIs

Both endpoints require a temporary automation token with `plans:apply` scope through `x-apiagex-automation-token`.

- `POST /api/ai/plans/preview`: validates the plan, rejects secret-looking fields/values, and returns operation summaries plus warnings.
- `POST /api/ai/plans/apply`: validates the plan again, applies additive operations, records permission history, and returns applied/skipped operation IDs.

Apply skips existing schema slugs or workflow method/path pairs instead of overwriting them.
