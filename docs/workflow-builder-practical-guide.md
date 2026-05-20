# Workflow Builder Practical Guide

This guide shows how to build a working Workflow API from scratch in the current Admin UI. It uses the implemented list/form workflow builder, not a future graph-only flow.

Ye guide current Admin UI ke list/form workflow builder ke hisab se hai. Future graph editor alag layer hai.

## Goal

Build this API:

```txt
POST /api/custom/products/lookup
```

It will:

1. Read `search` from the request body.
2. Query the `products` content schema.
3. Return matching entries.
4. Stay blocked until a Custom API permission is allowed.

## 1. Create A Content Schema

Open:

```txt
/adminui#schemas
```

Create schema:

```txt
Name: Products
Slug: products
```

Fields:

```txt
name      text      required
price     number    optional
status    text      optional
```

Hinglish: Pehle `products` schema banao. Ye wahi collection hai jisme workflow query karega.

## 2. Add Test Entries

Open:

```txt
/adminui#entries
```

Select `Products`, then create a few entries:

```json
{
  "name": "Phone",
  "price": 100,
  "status": "active"
}
```

```json
{
  "name": "Phone case",
  "price": 20,
  "status": "active"
}
```

```json
{
  "name": "Laptop",
  "price": 500,
  "status": "active"
}
```

## 3. Create A Workflow Route

Open:

```txt
/adminui#settings/workflows
```

Click:

```txt
Create workflow
```

Set:

```txt
Name: Product lookup
Method: POST
Path: /products/lookup
Active: off while building
```

Hinglish: Path `/products/lookup` likhne par final mounted API `/api/custom/products/lookup` banegi.

## 4. Add Workflow Steps

The form already includes a final `Return response` step. Add one step before it:

```txt
Add step -> Query entries
```

For the query step:

```txt
Schema slug: products
Search: {{body.search}}
Limit: 20
```

For the return step:

```txt
Status: 200
Body JSON:
```

```json
{
  "ok": true,
  "total": "{{steps.query-xxxx.total}}",
  "entries": "{{steps.query-xxxx.entries}}"
}
```

Replace `query-xxxx` with the actual step id shown in the form.

Practical tip: keep step ids stable and readable, for example:

```txt
find-products
```

Then your return body can be:

```json
{
  "ok": true,
  "total": "{{steps.find-products.total}}",
  "entries": "{{steps.find-products.entries}}"
}
```

## 5. Save And Test Run

Click:

```txt
Save workflow
```

Open the saved workflow with `Edit`, then use the test run panel.

Test body:

```json
{
  "search": "phone"
}
```

Expected result:

```json
{
  "ok": true,
  "total": 2,
  "entries": [
    { "data": { "name": "Phone" } },
    { "data": { "name": "Phone case" } }
  ]
}
```

Hinglish: Test run Admin UI ke andar hota hai. Isse route public/client ke liye open nahi hota.

## 6. Activate The Workflow

Edit the workflow and enable:

```txt
Active
```

Save again.

Important: active workflow route is still blocked by default. Permission allow karna zaruri hai.

## 7. Allow Custom API Permission

Open:

```txt
/adminui#settings/custom-api-permissions
```

Choose either:

```txt
public - open/no token
```

or a content API role such as:

```txt
reader
```

Search:

```txt
products lookup
```

Allow the workflow route and save.

Hinglish: Agar public allow karoge to token ki zarurat nahi. Agar reader role allow karoge to token banana padega.

## 8. Create Token For Role-Protected Calls

For token-protected route, open:

```txt
/adminui#settings/api-tokens
```

Create a token for the same content API role you allowed in Custom API Permissions.

Copy/use the token once. Later Admin UI should not reveal raw tokens again.

## 9. Call The Workflow API

Public call:

```bash
curl -X POST http://127.0.0.1:4000/api/custom/products/lookup \
  -H "content-type: application/json" \
  -d '{"search":"phone"}'
```

Token-protected call:

```bash
curl -X POST http://127.0.0.1:4000/api/custom/products/lookup \
  -H "Authorization: Bearer API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"search":"phone"}'
```

If permission is missing:

```json
{
  "ok": false,
  "error": "CUSTOM_API_PERMISSION_DENIED"
}
```

## Current Node Types

Implemented form-friendly nodes:

```txt
Validate body
Query entries
Create entry
Update entry
HTTP request
Hash password
Verify password
Return response
```

Implemented graph-readable nodes also include:

```txt
routeTrigger
getEntry
deleteEntry
branch
setVariable
```

## HTTP Request Node Notes

Before using `HTTP request`, configure allowed hosts:

```bash
APIAGEX_WORKFLOW_HTTP_ALLOWED_HOSTS=api.provider.test,api.stripe.com
```

Secret reference:

```txt
secret:provider.apiKey
```

Env variable:

```bash
APIAGEX_SECRET_PROVIDER_APIKEY=real-secret
```

The node blocks non-allowlisted hosts and private-network targets.

## Password Node Notes

`hashPassword` and `verifyPassword` use Node `crypto.scrypt`.

Use:

```txt
{{body.password}}
```

as the input expression, but do not store that value directly in an entry. Store only the hash output.

Login/token issuing is not production-complete until the planned `issueToken` node is implemented.

## Common Problems

`Workflow route returns 403`

The workflow is active, but Custom API Permission is not allowed for public or the token role.

`Workflow route returns 404`

The workflow is inactive, deleted, or server was not restarted after a route registration change.

`Template path was not found`

The expression references a wrong step id or missing input field. Check `{{steps.step-id.value}}` and the test body.

`HTTP_URL_NOT_ALLOWED`

The HTTP request node host is missing from `APIAGEX_WORKFLOW_HTTP_ALLOWED_HOSTS`.

`API_TOKEN_INVALID`

The token is wrong, revoked, or belongs to a different role than the allowed route.

## Hinglish Summary

1. Schema banao.
2. Entries banao.
3. Settings > Workflows me route banao.
4. Query/create/update/http/password/return steps add karo.
5. Test run se check karo.
6. Workflow active karo.
7. Settings > Custom API Permissions me public ya role allow karo.
8. Role-protected hai to Settings > API Tokens se token banao.
9. `/api/custom/...` route call karo.
