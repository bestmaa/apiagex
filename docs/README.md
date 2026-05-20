# Apiagex Docs

Fresh documentation will be rebuilt with the MVP.

MVP ke saath documentation fresh dobara banegi.

Primary docs route will be `/doc`; project summary route will be `/readme`.

Primary docs route `/doc` hoga; project summary route `/readme` hoga.

## Required Docs

- Owner setup and login
- Admin UI create API flow
- Schema and field guide
- Entry management guide
- Generated API usage
- Role allow/block guide
- Manual QA checklist
- Project stabilization audit: [project-stabilization-audit.md](./project-stabilization-audit.md)
- Install and publish flow: [install-and-publish-flow.md](./install-and-publish-flow.md)
- Database provider setup: [database-provider-setup.md](./database-provider-setup.md)
- Planned Workflow API Builder scope: [workflow-builder-scope.md](./workflow-builder-scope.md)
- Planned Workflow graph editor architecture: [workflow-graph-editor-plan.md](./workflow-graph-editor-plan.md)
- OTP workflow template plan: [otp-workflow-template-plan.md](./otp-workflow-template-plan.md)
- Google login workflow template plan: [google-login-workflow-template-plan.md](./google-login-workflow-template-plan.md)
- Workflow secret store plan: [workflow-secret-store-plan.md](./workflow-secret-store-plan.md)
- Workflow HTTP request node plan: [workflow-http-request-node-plan.md](./workflow-http-request-node-plan.md)
- Workflow password node plan: [workflow-password-node-plan.md](./workflow-password-node-plan.md)
- Workflow issue-token node plan: [workflow-issue-token-node-plan.md](./workflow-issue-token-node-plan.md)
- Workflow builder practical guide: [workflow-builder-practical-guide.md](./workflow-builder-practical-guide.md)
- Workflow builder browser check: [workflow-builder-browser-check.md](./workflow-builder-browser-check.md)

## Implemented Now

- `GET /api/health` returns the minimal server health payload.
- `GET /api/health` minimal server health payload deta hai.
- `/api`, `/doc`, `/readme`, and `/adminui` are served from the same server.
- `/api`, `/doc`, `/readme`, aur `/adminui` ek hi server se serve hote hain.
- `/doc` and `/readme` render current MVP status in English and Hinglish.
- `/doc` aur `/readme` current MVP status English aur Hinglish me dikhate hain.
- `/adminui` renders the MVP navigation shell: Dashboard, Schemas, Entries, APIs, Users, Settings, Docs.
- `/adminui` MVP navigation shell dikhata hai: Dashboard, Schemas, Entries, APIs, Users, Settings, Docs.
- Settings > API Docs separately controls generated Content API docs and Admin/control-plane API docs.
- Settings > API Docs generated Content API docs aur Admin/control-plane API docs ko alag-alag control karta hai.
- Generated projects default to TypeScript and include `src/custom-routes.ts` for business APIs that generated CRUD cannot model.
- Generated projects default TypeScript hote hain aur generated CRUD se bahar business APIs ke liye `src/custom-routes.ts` hota hai.
- Custom routes written as `/orders/:id/pay` are mounted at `/api/custom/orders/:id/pay`, listed in Settings > Custom API Permissions, and blocked until a role is allowed.
- Custom routes `/orders/:id/pay` jaisa likhne par `/api/custom/orders/:id/pay` par mount hote hain, Settings > Custom API Permissions me dikhte hain, aur role allow hone tak blocked rehte hain.
- TypeScript projects can run `npm run types` to generate `src/apiagex-types.ts` from current schemas for slug and field autocomplete.
- TypeScript projects current schemas se slug aur field autocomplete ke liye `npm run types` chala kar `src/apiagex-types.ts` generate kar sakte hain.
- Base path checkpoint verifies `/api`, `/api/health`, `/doc`, `/readme`, and `/adminui`.
- Base path checkpoint `/api`, `/api/health`, `/doc`, `/readme`, aur `/adminui` verify karta hai.
- SQLite foundation has MVP tables: migrations, roles, users, schemas, fields, entries, permissions.
- SQLite foundation me MVP tables hain: migrations, roles, users, schemas, fields, entries, permissions.
- `POST /api/auth/bootstrap-owner` creates the first owner user.
- `POST /api/auth/bootstrap-owner` pehla owner user banata hai.
- `POST /api/auth/login` logs in the owner after bootstrap.
- `POST /api/auth/login` bootstrap ke baad owner ko login karta hai.
- `/adminui` has owner login/logout controls.
- `/adminui` me owner login/logout controls hain.
- Admin UI is built in React and served from the same Fastify server.
- Admin UI React me bana hai aur same Fastify server se serve hota hai.
- `POST /api/admin/schemas` creates a schema with validated fields.
- `POST /api/admin/schemas` validated fields ke saath schema banata hai.
- `GET /api/admin/schemas` lists schemas, and `/api/admin/schemas/:id` supports read, update, and delete.
- `GET /api/admin/schemas` schemas list karta hai, aur `/api/admin/schemas/:id` read, update, delete support karta hai.
- `/adminui` has a React schema builder form for text, long text, number, boolean, date, JSON, media, and relation fields.
- `/adminui` me text, long text, number, boolean, date, JSON, media, aur relation fields ke liye React schema builder form hai.
- Relation fields show a target schema picker and cannot save without a valid existing schema.
- Relation fields target schema picker dikhate hain aur valid existing schema ke bina save nahi hote.
- Project stabilization audit is documented in `docs/project-stabilization-audit.md`.
- Project stabilization audit `docs/project-stabilization-audit.md` me documented hai.
- Install and publish flow is documented in `docs/install-and-publish-flow.md`.
- Install aur publish flow `docs/install-and-publish-flow.md` me documented hai.
- Database provider setup is documented in `docs/database-provider-setup.md`.
- Database provider setup `docs/database-provider-setup.md` me documented hai.
- Planned Workflow API Builder scope is documented in `docs/workflow-builder-scope.md`.
- Planned Workflow API Builder scope `docs/workflow-builder-scope.md` me documented hai.
- OTP workflow template planning is documented in `docs/otp-workflow-template-plan.md`.
- OTP workflow template planning `docs/otp-workflow-template-plan.md` me documented hai.
- Google login workflow template planning is documented in `docs/google-login-workflow-template-plan.md`.
- Google login workflow template planning `docs/google-login-workflow-template-plan.md` me documented hai.
- Workflow secret store planning is documented in `docs/workflow-secret-store-plan.md`.
- Workflow secret store planning `docs/workflow-secret-store-plan.md` me documented hai.
- Workflow HTTP request node planning is documented in `docs/workflow-http-request-node-plan.md`.
- Workflow HTTP request node planning `docs/workflow-http-request-node-plan.md` me documented hai.
- Workflow HTTP request nodes can call allowlisted external providers with env-backed `secret:namespace.key` references.
- Workflow HTTP request nodes allowlisted external providers ko env-backed `secret:namespace.key` references ke saath call kar sakte hain.
- Workflow password node planning is documented in `docs/workflow-password-node-plan.md`.
- Workflow password node planning `docs/workflow-password-node-plan.md` me documented hai.
- Workflow issue-token node planning is documented in `docs/workflow-issue-token-node-plan.md`.
- Workflow issue-token node planning `docs/workflow-issue-token-node-plan.md` me documented hai.
- Workflow builder practical guide is documented in `docs/workflow-builder-practical-guide.md`.
- Workflow builder practical guide `docs/workflow-builder-practical-guide.md` me documented hai.
- Workflow builder browser check is documented in `docs/workflow-builder-browser-check.md`.
- Workflow builder browser check `docs/workflow-builder-browser-check.md` me documented hai.

## Owner Bootstrap And Login

### English

Use `POST /api/auth/bootstrap-owner` once to create the first owner.
Send JSON: `{ "email": "owner@apiagex.local", "password": "OwnerPass123!" }`.
After the owner exists, use `POST /api/auth/login` with the same shape.
The React Admin UI at `/adminui` first tries bootstrap, then falls back to login when the owner already exists.

### Hinglish

Pehla owner banane ke liye `POST /api/auth/bootstrap-owner` ek baar use karo.
JSON bhejo: `{ "email": "owner@apiagex.local", "password": "OwnerPass123!" }`.
Owner banne ke baad same shape ke saath `POST /api/auth/login` use karo.
`/adminui` ka React UI pehle bootstrap try karta hai, aur owner already hone par login karta hai.

## Owner Checkpoint

English: v0.2.4 verifies owner bootstrap API, login API, React Admin UI login/logout, and docs.

Hinglish: v0.2.4 owner bootstrap API, login API, React Admin UI login/logout, aur docs verify karta hai.

## Schema Repository

English: Schemas have name, slug, description, and ordered fields. Relation fields must target an existing schema before save.

Hinglish: Schema me name, slug, description, aur ordered fields hote hain. Relation field save hone se pehle existing schema ko target karega.

## Schema Admin APIs

### English

Use `POST /api/admin/schemas` with `name`, `slug`, optional `description`, and `fields`.
Field types are `text`, `longText`, `number`, `boolean`, `date`, `json`, `media`, and `relation`.
Use `GET /api/admin/schemas` to list, `GET /api/admin/schemas/:id` to read, `PUT /api/admin/schemas/:id` to update, and `DELETE /api/admin/schemas/:id` to remove.

### Hinglish

`POST /api/admin/schemas` me `name`, `slug`, optional `description`, aur `fields` bhejo.
Field types `text`, `longText`, `number`, `boolean`, `date`, `json`, `media`, aur `relation` hain.
List ke liye `GET /api/admin/schemas`, read ke liye `GET /api/admin/schemas/:id`, update ke liye `PUT /api/admin/schemas/:id`, aur delete ke liye `DELETE /api/admin/schemas/:id` use karo.

### Example

```json
{
  "name": "Article",
  "slug": "article",
  "description": "Editorial content",
  "fields": [
    { "name": "Title", "slug": "title", "type": "text", "required": true },
    { "name": "Body", "slug": "body", "type": "longText" }
  ]
}
```

## Admin UI Schema Builder

### English

After owner login, `/adminui` shows a schema builder. Add schema name, slug, description, and one or more fields. The form can choose every MVP field type. Relation fields require selecting an existing schema.

### Hinglish

Owner login ke baad `/adminui` schema builder dikhata hai. Schema name, slug, description, aur ek ya jyada fields add karo. Form har MVP field type choose kar sakta hai. Relation fields ke liye existing schema select karna zaruri hai.

## Relation Rules

### English

Create the target schema first, then create a relation field in another schema. Relation fields store `relationSchemaId`, so deleting or renaming labels later does not break the field target. The backend rejects missing targets with `RELATION_TARGET_REQUIRED` or `RELATION_TARGET_MISSING`.

### Hinglish

Pehle target schema banao, phir dusre schema me relation field banao. Relation fields `relationSchemaId` store karte hain, isliye label rename hone par target break nahi hota. Backend missing target ko `RELATION_TARGET_REQUIRED` ya `RELATION_TARGET_MISSING` se reject karta hai.

## Schema Builder Checkpoint

English: v0.3.5 verifies schema repositories, schema admin APIs, React schema builder UI, relation picker, docs, tests, audit, and Browser Use schema flow.

Hinglish: v0.3.5 schema repositories, schema admin APIs, React schema builder UI, relation picker, docs, tests, audit, aur Browser Use schema flow verify karta hai.

## Entry Repository

### English

Entries store JSON data for one schema. The repository rejects unknown fields, missing required fields, wrong value types, and relation values that do not point to an entry in the target schema.

### Hinglish

Entries ek schema ke liye JSON data store karte hain. Repository unknown fields, missing required fields, galat value types, aur relation values ko reject karti hai jo target schema ke entry ko point nahi karte.

## Entry Admin APIs

### English

Use `POST /api/admin/schemas/:schemaId/entries` with `{ "data": { ... } }` to create an entry. Use the same base path for list, and add `/:entryId` for read, update, and delete.

### Hinglish

Entry create karne ke liye `POST /api/admin/schemas/:schemaId/entries` par `{ "data": { ... } }` bhejo. List ke liye same base path use karo, aur read, update, delete ke liye `/:entryId` add karo.

## Admin UI Entry Forms

### English

After owner login, the Entry Manager reads schemas and renders a form from the selected schema fields. Text, long text, number, boolean, date, JSON, media, and relation fields are shown with matching inputs.

### Hinglish

Owner login ke baad Entry Manager schemas read karta hai aur selected schema fields se form render karta hai. Text, long text, number, boolean, date, JSON, media, aur relation fields matching inputs ke saath dikhte hain.

## Dynamic Content APIs

### English

Every schema slug creates `/api/content/:schemaSlug`. Use `GET` to list entries and `POST` with `{ "data": { ... } }` to create. Use `/api/content/:schemaSlug/:entryId` for read, update, and delete.

### Hinglish

Har schema slug `/api/content/:schemaSlug` banata hai. Entries list ke liye `GET` aur create ke liye `{ "data": { ... } }` ke saath `POST` use karo. Read, update, delete ke liye `/api/content/:schemaSlug/:entryId` use karo.

### Dynamic API Examples

```bash
curl http://127.0.0.1:4000/api/content/article
curl -X POST http://127.0.0.1:4000/api/content/article \
  -H "content-type: application/json" \
  -d '{"data":{"title":"Hello"}}'
curl -X PUT http://127.0.0.1:4000/api/content/article/ENTRY_ID \
  -H "content-type: application/json" \
  -d '{"data":{"title":"Updated"}}'
curl -X DELETE http://127.0.0.1:4000/api/content/article/ENTRY_ID
```

English: Replace `article` with the schema slug and `ENTRY_ID` with the entry id returned from create/list.

Hinglish: `article` ko schema slug se replace karo aur `ENTRY_ID` ko create/list se mile entry id se replace karo.

## Generated API List

### English

The Admin UI shows every generated dynamic API in the Generated APIs section. Each schema displays its `/api/content/:schemaSlug` route and supported actions.

### Hinglish

Admin UI Generated APIs section me har generated dynamic API dikhata hai. Har schema apna `/api/content/:schemaSlug` route aur supported actions show karta hai.

## Dynamic API Checkpoint

English: v0.4.6 verifies schema creation, entry creation, generated dynamic API CRUD, Admin UI entry forms, generated API list, docs, tests, audit, and Browser Use checks.

Hinglish: v0.4.6 schema creation, entry creation, generated dynamic API CRUD, Admin UI entry forms, generated API list, docs, tests, audit, aur Browser Use checks verify karta hai.

## Role Admin APIs

### English

Use `POST /api/admin/roles` with `{ "name": "editor", "description": "..." }` to create API roles. Use `GET /api/admin/roles` to list API roles and `GET /api/admin/roles/:roleId` to read one API role. Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`; they are seeded for control-plane use and hidden from this API role list.

### Hinglish

API roles create karne ke liye `POST /api/admin/roles` par `{ "name": "editor", "description": "..." }` bhejo. API roles list ke liye `GET /api/admin/roles` aur one API role read ke liye `GET /api/admin/roles/:roleId` use karo. Admin roles `owner`, `admin`, `schema-manager`, aur `user-manager` control-plane ke liye seeded hain aur is API role list se hidden hain.

## Settings Access Control

### English

Use `/adminui#settings/admin-roles` for Admin Roles and `/adminui#settings/content-roles` for generated Content Roles. Use `GET /api/admin/settings/access` to read both catalogs. Use `POST /api/admin/settings/access/admin-roles` to create custom admin roles. Use `PUT /api/admin/settings/access/admin-roles/:roleId/permissions` to save admin permissions for `schemas`, `entries`, `apiRoles`, `apiUsers`, and `settings`. These are stored in `admin_permissions`, not in generated content API permissions.

### Hinglish

Admin Roles ke liye `/adminui#settings/admin-roles` aur generated Content Roles ke liye `/adminui#settings/content-roles` use karo. Dono catalog read karne ke liye `GET /api/admin/settings/access` use karo. Custom admin roles banane ke liye `POST /api/admin/settings/access/admin-roles` use karo. Admin permissions save karne ke liye `PUT /api/admin/settings/access/admin-roles/:roleId/permissions` use karo jisme `schemas`, `entries`, `apiRoles`, `apiUsers`, aur `settings` actions hain. Ye `admin_permissions` me store hote hain, generated content API permissions me nahi.

## Permission Model

### English

Permissions are stored per API role, schema, and action. Actions are `getAll`, `get`, `create`, `update`, `delete`, and `manage`. Missing permission means blocked. `manage` allows every content API action for that schema. Owner/admin roles do not bypass content API permission checks.

### Hinglish

Permissions API role, schema, aur action ke hisab se store hote hain. Actions `getAll`, `get`, `create`, `update`, `delete`, aur `manage` hain. Missing permission ka matlab block hai. `manage` us schema ke sab content API actions allow karta hai. Owner/admin roles content API permission checks bypass nahi karte.

## Custom Business API End-To-End

### English

Use custom routes when generated CRUD is not enough, for example payment, workflow, report, or kitchen-board actions.

1. Add the route in `src/custom-routes.ts`:

```ts
import type { RegisterApiagexCustomRoutes } from "@apiagex/server";

export const registerCustomRoutes: RegisterApiagexCustomRoutes = async (app, apiagex) => {
  app.post("/orders/:entryId/pay", async (request, reply) => {
    const entry = await apiagex.entries.getById(request.params.entryId);
    if (!entry) return reply.code(404).send({ ok: false, error: "ORDER_NOT_FOUND" });
    return {
      ok: true,
      entry: await apiagex.entries.update(entry.id, {
        data: { ...entry.data, status: "paid" },
      }),
    };
  });
};
```

2. Restart the server. Apiagex discovers it as `POST /api/custom/orders/:entryId/pay`.
3. Open `/adminui#settings/custom-api-permissions`.
4. Create or select a content API role, for example `writer`.
5. Search `orders`, allow the route, and click **Save custom API permissions**.
6. Open Settings > API Tokens, create a token for the same role, and call the route:

```bash
curl -X POST http://127.0.0.1:4000/api/custom/orders/ENTRY_ID/pay \
  -H "Authorization: Bearer API_TOKEN"
```

Custom API routes are blocked by default. Public/no-token access works only when the `public` role is explicitly allowed. You can rename the route label/group in Admin UI, view permission history, and delete old inactive routes after the route is removed from code and the server restarts.

### Hinglish

Generated CRUD kaafi na ho, jaise payment, workflow, report, ya kitchen-board action, tab custom routes use karo.

1. `src/custom-routes.ts` me route add karo.
2. Server restart karo. Apiagex usko `POST /api/custom/orders/:entryId/pay` ke roop me discover karega.
3. `/adminui#settings/custom-api-permissions` open karo.
4. Content API role create/select karo, jaise `writer`.
5. `orders` search karo, route allow karo, aur **Save custom API permissions** click karo.
6. Settings > API Tokens me same role ke liye token banao, phir curl se call karo:

```bash
curl -X POST http://127.0.0.1:4000/api/custom/orders/ENTRY_ID/pay \
  -H "Authorization: Bearer API_TOKEN"
```

Custom API default me blocked hoti hai. Public/no-token access tabhi milega jab `public` role ko explicitly allow karoge. Admin UI me route label/group rename, permission history view, aur code se remove hone ke baad inactive route delete kar sakte ho.

## Admin UI Role Permissions

### English

The Role Permissions screen shows API roles only, selects an active API role, shows every generated schema API, and saves action checkboxes for `getAll`, `get`, `create`, `update`, `delete`, and `manage`.

### Hinglish

Role Permissions screen sirf API roles dikhata hai, active API role select karta hai, har generated schema API dikhata hai, aur `getAll`, `get`, `create`, `update`, `delete`, `manage` action checkboxes save karta hai.

## Dynamic API Permission Enforcement

### English

Dynamic APIs check permissions when a request sends `x-apiagex-role-id`. Missing permissions return `403` with `API_PERMISSION_DENIED`. Requests without that header still work for current owner/admin tooling until user login tokens are added.

### Hinglish

Dynamic APIs permission tab check karte hain jab request `x-apiagex-role-id` bhejti hai. Missing permissions par `403` aur `API_PERMISSION_DENIED` return hota hai. User login tokens add hone tak header ke bina current owner/admin tooling work karta rahega.

## User Admin APIs

### English

Use `POST /api/admin/users` with `email`, `password`, and `roleId` to create a content API user assigned to exactly one API role. Use `GET /api/admin/users` to list users and `GET /api/admin/users/:userId` to read one user.

### Hinglish

Exactly ek API role assigned content API user create karne ke liye `POST /api/admin/users` par `email`, `password`, aur `roleId` bhejo. Users list ke liye `GET /api/admin/users` aur one user read ke liye `GET /api/admin/users/:userId` use karo.

## Admin UI Users

### English

The Users screen loads API roles, creates users with email/password/API role, and lists created users with their assigned API role. MVP content API users belong to exactly one API role.

### Hinglish

Users screen API roles load karta hai, email/password/API role ke saath users create karta hai, aur created users ko assigned API role ke saath list karta hai. MVP me har content API user exactly ek API role me hota hai.

## RBAC End-To-End Flow

### English

The verified RBAC flow creates a schema API, uses API roles, assigns `getAll` for list reads or `get` for one-entry reads, creates content API users, logs in users through `POST /api/auth/login-user`, then checks that the allowed API role can access the intended API and the blocked API role receives `API_PERMISSION_DENIED`. `manage` allows every content API action for that schema.

### Hinglish

Verified RBAC flow schema API banata hai, API roles use karta hai, list reads ke liye `getAll` ya one-entry reads ke liye `get` assign karta hai, content API users create karta hai, `POST /api/auth/login-user` se users login karta hai, phir check karta hai ki allowed API role intended API access kar sakta hai aur blocked API role ko `API_PERMISSION_DENIED` milta hai. `manage` us schema ke sab content API actions allow karta hai.

## RBAC Allow/Block Examples

### English

Create an API role or use one seeded API role (`reader`, `single-reader`, `writer`, `editor`, `public`), then save permissions for a schema API:

```bash
curl -X POST http://127.0.0.1:4000/api/admin/roles \
  -H "content-type: application/json" \
  -d '{"name":"custom-reader"}'
curl -X PUT http://127.0.0.1:4000/api/admin/roles/ROLE_ID/permissions \
  -H "content-type: application/json" \
  -d '{"permissions":[{"schemaId":"SCHEMA_ID","action":"getAll","allowed":true},{"schemaId":"SCHEMA_ID","action":"get","allowed":true}]}'
```

Create a user in that API role, login, then pass the returned `roleId` as `x-apiagex-role-id` when calling dynamic APIs. If permission is missing, the API returns `403 API_PERMISSION_DENIED`. Use `getAll` for `GET /api/content/:schemaSlug`, `get` for `GET /api/content/:schemaSlug/:entryId`, and `manage` when the API role should have every action on that schema.

### Hinglish

Pehle API role banao ya seeded API role (`reader`, `single-reader`, `writer`, `editor`, `public`) use karo, phir schema API ke liye permissions save karo:

```bash
curl -X POST http://127.0.0.1:4000/api/admin/users \
  -H "content-type: application/json" \
  -d '{"email":"reader@apiagex.local","password":"UserPass123!","roleId":"ROLE_ID"}'
curl -X POST http://127.0.0.1:4000/api/auth/login-user \
  -H "content-type: application/json" \
  -d '{"email":"reader@apiagex.local","password":"UserPass123!"}'
curl http://127.0.0.1:4000/api/content/article \
  -H "x-apiagex-role-id: ROLE_ID"
```

Jis API role ko permission mili hai uska request pass hota hai. Jis API role ko permission nahi mili usko `403 API_PERMISSION_DENIED` milta hai. `GET /api/content/:schemaSlug` ke liye `getAll`, `GET /api/content/:schemaSlug/:entryId` ke liye `get`, aur schema ke sab actions ke liye `manage` use karo.

## MVP RBAC Checkpoint

English: v0.5.8 verifies role APIs, permission model, role permission UI, dynamic API enforcement, user APIs, user UI, user login, allowed role success, blocked role failure, docs, tests, audit, and Browser Use checks.

Hinglish: v0.5.8 role APIs, permission model, role permission UI, dynamic API enforcement, user APIs, user UI, user login, allowed role success, blocked role failure, docs, tests, audit, aur Browser Use checks verify karta hai.

## Admin UI Polish

### English

The Admin UI now uses a cleaner control-plane layout with a stronger header, compact navigation, consistent form controls, clear empty states, and responsive mobile spacing.

### Hinglish

Admin UI ab cleaner control-plane layout use karta hai jisme stronger header, compact navigation, consistent form controls, clear empty states, aur responsive mobile spacing hai.

## Manual QA Checklist

English: Full manual QA steps for Browser Use and API requests are in [qa-checklist.md](./qa-checklist.md).

Hinglish: Browser Use aur API requests ke full manual QA steps [qa-checklist.md](./qa-checklist.md) me hain.

## MVP Contract

### English

Apiagex MVP runs on one server with four paths: `/api`, `/adminui`, `/doc`, and `/readme`.
The owner logs in first, creates schemas from Admin UI, adds fields, creates entries, and receives generated APIs under `/api/content/:schemaSlug`.
Schema fields must support text, long text, number, boolean, date, JSON, media, and relation.
Relations must point to an existing schema before the schema can be saved.
The Admin UI must list every generated API, show docs/examples, create API roles, assign API permissions with checkboxes, create users, and assign one API role per user.
Allowed users must access the API; blocked users must fail.

### Hinglish

Apiagex MVP ek hi server par chalega jisme chaar path honge: `/api`, `/adminui`, `/doc`, aur `/readme`.
Owner sabse pehle login karega, Admin UI se schema banayega, fields add karega, entries create karega, aur system `/api/content/:schemaSlug` par generated API dega.
Schema fields me text, long text, number, boolean, date, JSON, media, aur relation support hona chahiye.
Relation field save hone se pehle existing schema ko point karna chahiye.
Admin UI me har generated API ki list, docs/examples, role creation, checkbox based API permissions, user creation, aur user ko role assign karne ka flow hona chahiye.
Allowed user API access kare; blocked user fail ho.
