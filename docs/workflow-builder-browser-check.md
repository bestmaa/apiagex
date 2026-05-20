# Workflow Builder Browser Check

This document is the Playwright/browser verification checklist for the current Workflow Builder Admin UI. It is intentionally written as a repeatable browser check because this repo does not yet keep a committed Playwright test runner dependency.

Ye checklist current Admin UI ke browser flow ke liye hai: login, workflow create, steps, test run, activate, permission allow, token, aur API call.

## Run Setup

Use an isolated SQLite database:

```bash
rm -f /tmp/apiagex-workflow-browser.sqlite /tmp/apiagex-workflow-browser.sqlite-*
APIAGEX_DATABASE_PROVIDER=sqlite \
APIAGEX_DATABASE_PATH=/tmp/apiagex-workflow-browser.sqlite \
HOST=127.0.0.1 \
PORT=4360 \
npm run dev -w @apiagex/server
```

Open with Playwright CLI:

```bash
TMPDIR=/tmp npx --package @playwright/cli playwright-cli open http://127.0.0.1:4360/adminui --browser firefox
TMPDIR=/tmp npx --package @playwright/cli playwright-cli snapshot
```

## 1. Owner Login / Setup

In the browser:

```txt
Email: owner@example.com
Password: Password123!
Submit: Setup or login owner
```

Expected:

```txt
Logged in owner: owner@example.com
```

## 2. Create Schema

Navigate:

```txt
Schemas
```

Create:

```txt
Name: Products
Slug: products
Fields:
  name   text    required
  price  number  optional
```

Expected:

```txt
Products appears in schema list.
```

## 3. Create Entries

Navigate:

```txt
Entries -> Products
```

Create:

```json
{ "name": "Phone", "price": 100 }
```

```json
{ "name": "Phone case", "price": 20 }
```

Expected:

```txt
Products entry table shows both entries.
```

## 4. Create Workflow

Navigate:

```txt
Settings -> Workflows
```

Create workflow:

```txt
Name: Product lookup
Method: POST
Path: /products/lookup
Active: off
```

Add steps:

```txt
Query entries
Return response
```

Set query step:

```txt
Step id: find-products
Schema slug: products
Search: {{body.search}}
Limit: 20
```

Set return step body:

```json
{
  "ok": true,
  "total": "{{steps.find-products.total}}",
  "entries": "{{steps.find-products.entries}}"
}
```

Save.

Expected:

```txt
Workflow list shows Product lookup.
Mounted route is /api/custom/products/lookup.
```

## 5. Test Run

Open `Edit` for the workflow.

Test body:

```json
{
  "search": "phone"
}
```

Run test.

Expected:

```txt
Workflow test passed.
Response includes total 2.
Response entries include Phone and Phone case.
```

## 6. Activate Workflow

Enable:

```txt
Active
```

Save.

Expected:

```txt
Workflow row shows Active.
```

## 7. Allow Permission

Navigate:

```txt
Settings -> Custom API Permissions
```

Select:

```txt
public - open/no token
```

Search:

```txt
products lookup
```

Allow the route and save.

Expected:

```txt
Route shows ALLOWED for public.
```

## 8. API Call

Public call:

```bash
curl -X POST http://127.0.0.1:4360/api/custom/products/lookup \
  -H "content-type: application/json" \
  -d '{"search":"phone"}'
```

Expected:

```json
{
  "ok": true,
  "total": 2
}
```

## 9. Token-Protected Variant

Instead of public permission:

1. Create or use a content API role.
2. Allow the workflow route for that role in Custom API Permissions.
3. Open Settings -> API Tokens.
4. Create a token for the same role.
5. Call with:

```bash
curl -X POST http://127.0.0.1:4360/api/custom/products/lookup \
  -H "Authorization: Bearer API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"search":"phone"}'
```

Expected:

```txt
Allowed token succeeds.
Missing/wrong token returns API_TOKEN_INVALID or CUSTOM_API_PERMISSION_DENIED.
```

## Cleanup

Stop the server and remove the isolated database:

```bash
lsof -ti tcp:4360 | xargs -r kill
rm -f /tmp/apiagex-workflow-browser.sqlite /tmp/apiagex-workflow-browser.sqlite-*
```

## Current Automated Coverage

The repository also has non-browser coverage for the same surfaces:

- `packages/admin/src/WorkflowManager.test.tsx`: workflow form, graph, node creation, test panel, history panel.
- `packages/server/tests/workflow-api-routes.test.ts`: mounted workflow API behavior.
- `packages/server/tests/workflow-*-node.test.ts`: node executors.
- `packages/database/tests/workflow-repository.test.ts`: workflow storage and validation.

This browser checklist protects the real Admin UI path until a committed Playwright test runner is added.
