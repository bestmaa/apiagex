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

## Implemented Now

- `GET /api/health` returns the minimal server health payload.
- `GET /api/health` minimal server health payload deta hai.
- `/api`, `/doc`, `/readme`, and `/adminui` are served from the same server.
- `/api`, `/doc`, `/readme`, aur `/adminui` ek hi server se serve hote hain.
- `/doc` and `/readme` render current MVP status in English and Hinglish.
- `/doc` aur `/readme` current MVP status English aur Hinglish me dikhate hain.
- `/adminui` renders the MVP navigation shell: Dashboard, Schemas, APIs, Roles, Users, Docs.
- `/adminui` MVP navigation shell dikhata hai: Dashboard, Schemas, APIs, Roles, Users, Docs.
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

Use `POST /api/admin/roles` with `{ "name": "editor", "description": "..." }` to create roles. Use `GET /api/admin/roles` to list roles and `GET /api/admin/roles/:roleId` to read one role. The `owner` role name is reserved.

### Hinglish

Roles create karne ke liye `POST /api/admin/roles` par `{ "name": "editor", "description": "..." }` bhejo. Roles list ke liye `GET /api/admin/roles` aur one role read ke liye `GET /api/admin/roles/:roleId` use karo. `owner` role name reserved hai.

## Permission Model

### English

Permissions are stored per role, schema, and action. Actions are `read`, `create`, `update`, `delete`, and `manage`. Missing permission means blocked. `manage` allows every action for that schema. Owner roles bypass checks.

### Hinglish

Permissions role, schema, aur action ke hisab se store hote hain. Actions `read`, `create`, `update`, `delete`, aur `manage` hain. Missing permission ka matlab block hai. `manage` us schema ke liye har action allow karta hai. Owner roles checks bypass karte hain.

## Admin UI Role Permissions

### English

The Role Permissions screen creates roles, selects an active role, shows every generated schema API, and saves action checkboxes for `read`, `create`, `update`, `delete`, and `manage`.

### Hinglish

Role Permissions screen roles create karta hai, active role select karta hai, har generated schema API dikhata hai, aur `read`, `create`, `update`, `delete`, `manage` action checkboxes save karta hai.

## MVP Contract

### English

Apiagex MVP runs on one server with four paths: `/api`, `/adminui`, `/doc`, and `/readme`.
The owner logs in first, creates schemas from Admin UI, adds fields, creates entries, and receives generated APIs under `/api/content/:schemaSlug`.
Schema fields must support text, long text, number, boolean, date, JSON, media, and relation.
Relations must point to an existing schema before the schema can be saved.
The Admin UI must list every generated API, show docs/examples, create roles, assign API permissions with checkboxes, create users, and assign one role per user.
Allowed users must access the API; blocked users must fail.

### Hinglish

Apiagex MVP ek hi server par chalega jisme chaar path honge: `/api`, `/adminui`, `/doc`, aur `/readme`.
Owner sabse pehle login karega, Admin UI se schema banayega, fields add karega, entries create karega, aur system `/api/content/:schemaSlug` par generated API dega.
Schema fields me text, long text, number, boolean, date, JSON, media, aur relation support hona chahiye.
Relation field save hone se pehle existing schema ko point karna chahiye.
Admin UI me har generated API ki list, docs/examples, role creation, checkbox based API permissions, user creation, aur user ko role assign karne ka flow hona chahiye.
Allowed user API access kare; blocked user fail ho.
