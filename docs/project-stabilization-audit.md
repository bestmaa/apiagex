# Apiagex Project Stabilization Audit

This audit is the practical “before new features” checkpoint for the current Apiagex MVP.

Ye audit current Apiagex MVP ka practical “new feature se pehle” checkpoint hai.

## Verified Scope

### English

- Base server routes: `/api`, `/api/health`, `/adminui`, `/doc`, `/readme`.
- Owner auth: first owner bootstrap, duplicate bootstrap block, owner login.
- Schema builder API: create schemas with normal fields and relation fields.
- Entry APIs: create entries through generated `/api/content/:schemaSlug` routes.
- Content query API: `fields`, `search`, `limit`, `offset`, and pagination metadata.
- Relation reads: raw relation ids and one-level `?populate=relations`.
- API roles and permissions: `getAll`, `get`, and blocked default behavior.
- API tokens: bearer-token content API access for allowed roles.
- Users: one content API role per user and `POST /api/auth/login-user`.
- Webhooks: registration, signed delivery headers, success delivery logs.
- Realtime API: opt-in schema events, one-time realtime session tokens, WebSocket event delivery, ack, and event history.
- Admin UI/docs pages: desktop and mobile browser rendering for `/adminui`, `/doc`, `/readme`, settings, docs, users, entries, and APIs routes.

### Hinglish

- Base server routes: `/api`, `/api/health`, `/adminui`, `/doc`, `/readme`.
- Owner auth: pehla owner bootstrap, duplicate bootstrap block, owner login.
- Schema builder API: normal fields aur relation fields ke saath schema create.
- Entry APIs: generated `/api/content/:schemaSlug` routes se entries create.
- Content query API: `fields`, `search`, `limit`, `offset`, aur pagination metadata.
- Relation reads: raw relation ids aur one-level `?populate=relations`.
- API roles and permissions: `getAll`, `get`, aur default blocked behavior.
- API tokens: allowed role ke bearer token se content API access.
- Users: har user ke liye one content API role aur `POST /api/auth/login-user`.
- Webhooks: registration, signed delivery headers, success delivery logs.
- Realtime API: schema-wise opt-in events, one-time realtime session tokens, WebSocket event delivery, ack, aur event history.
- Admin UI/docs pages: `/adminui`, `/doc`, `/readme`, settings, docs, users, entries, aur APIs routes ka desktop/mobile browser rendering.

## Practical User Flows

### 1. First Owner Setup

English:

1. Start the server with `npm run dev`.
2. Open `/adminui`.
3. Enter owner email and password.
4. On a fresh database, the UI creates the owner with `POST /api/auth/bootstrap-owner`.
5. On later visits, the same form logs in with `POST /api/auth/login`.

Expected result: owner can enter the Admin UI. A second bootstrap attempt returns `OWNER_ALREADY_BOOTSTRAPPED`.

Hinglish:

1. Server `npm run dev` se start karo.
2. `/adminui` open karo.
3. Owner email/password enter karo.
4. Fresh database par UI `POST /api/auth/bootstrap-owner` se owner banata hai.
5. Baad me same form `POST /api/auth/login` se login karta hai.

Expected result: owner Admin UI me enter kar sakta hai. Second bootstrap attempt `OWNER_ALREADY_BOOTSTRAPPED` return karta hai.

### 2. Create API From Schema

English:

1. Open Schemas in Admin UI.
2. Create a target schema first if a relation field needs one.
3. Create the main schema with fields such as `title`, `views`, or relation `author`.
4. The generated API is available immediately at `/api/content/:schemaSlug`.

Example:

```bash
curl -X POST http://127.0.0.1:4000/api/admin/schemas \
  -H "content-type: application/json" \
  -d '{"name":"Article","slug":"article","fields":[{"name":"Title","slug":"title","type":"text","required":true}]}'
```

Expected result: schema appears in Admin UI Entries, APIs, Settings Content Roles, Webhooks, and Realtime API collection lists.

Hinglish:

1. Admin UI me Schemas open karo.
2. Relation field chahiye to pehle target schema banao.
3. Main schema `title`, `views`, ya relation `author` jaise fields ke saath banao.
4. Generated API turant `/api/content/:schemaSlug` par available hoti hai.

Expected result: schema Admin UI Entries, APIs, Settings Content Roles, Webhooks, aur Realtime API collection lists me dikhna chahiye.

### 3. Create And Query Entries

English:

Use the Admin UI Entries screen or the generated content API.

```bash
curl -X POST http://127.0.0.1:4000/api/content/article \
  -H "content-type: application/json" \
  -d '{"data":{"title":"Alpha Launch","views":10}}'

curl "http://127.0.0.1:4000/api/content/article?fields=title&search=Alpha&limit=50&offset=0"
```

Expected result: list response includes `entries`, `limit`, `offset`, and `total` when query parameters are used. Unknown fields return `ENTRY_FIELD_UNKNOWN`.

Hinglish:

Admin UI Entries screen ya generated content API use karo.

Expected result: query parameters use karne par list response me `entries`, `limit`, `offset`, aur `total` milta hai. Unknown field par `ENTRY_FIELD_UNKNOWN` milta hai.

### 4. Relation Read And Populate

English:

- Raw reads return relation entry ids.
- `?populate=relations`, `?populate=all`, and `?populate=*` expand one relation level.
- If the request role can read the source but cannot read the target schema, the relation becomes `null`.

```bash
curl "http://127.0.0.1:4000/api/content/book/ENTRY_ID?populate=relations"
```

Hinglish:

- Raw reads relation entry ids return karte hain.
- `?populate=relations`, `?populate=all`, aur `?populate=*` one relation level expand karte hain.
- Request role source read kar sakta hai lekin target schema read nahi kar sakta to relation `null` hota hai.

### 5. API Roles, Tokens, And Users

English:

1. Open Settings > Content Roles.
2. Create or select an API role.
3. Save per-schema permissions.
4. Create an API token or create a user assigned to that role.
5. Send the token as `Authorization: Bearer TOKEN` or `x-apiagex-api-token`.

Expected errors:

- Missing permission: `403 API_PERMISSION_DENIED`.
- Revoked or invalid token: `403 API_TOKEN_INVALID`.
- User login with wrong password: `401 USER_LOGIN_FAILED`.

Hinglish:

1. Settings > Content Roles open karo.
2. API role create ya select karo.
3. Per-schema permissions save karo.
4. API token banao ya us role ke saath user create karo.
5. Token ko `Authorization: Bearer TOKEN` ya `x-apiagex-api-token` me bhejo.

Expected errors:

- Missing permission: `403 API_PERMISSION_DENIED`.
- Revoked ya invalid token: `403 API_TOKEN_INVALID`.
- Wrong password user login: `401 USER_LOGIN_FAILED`.

### 6. Webhooks

English:

1. Open Settings > Webhooks.
2. Add target URL, select events, and optionally select one collection.
3. On matching create/update/delete, Apiagex sends signed JSON.
4. Receiver verifies `x-apiagex-signature`, `x-apiagex-timestamp`, and `x-apiagex-delivery-id`.

Expected result: content write still succeeds if the hook target fails; failed deliveries are logged and retried.

Hinglish:

1. Settings > Webhooks open karo.
2. Target URL add karo, events select karo, optional collection select karo.
3. Matching create/update/delete par Apiagex signed JSON send karta hai.
4. Receiver `x-apiagex-signature`, `x-apiagex-timestamp`, aur `x-apiagex-delivery-id` verify kare.

Expected result: hook target fail hone par bhi content write successful hota hai; failed deliveries log aur retry hoti hain.

### 7. Realtime API

English:

1. Open Settings > Realtime API.
2. Enable a collection and event types.
3. Trusted backend creates a session:

```bash
curl -X POST http://127.0.0.1:4000/api/realtime/session \
  -H "content-type: application/json" \
  -H "authorization: Bearer API_TOKEN" \
  -d '{"schema":"orders","ttlSeconds":300}'
```

4. Browser connects with `ws://HOST/api/realtime?schema=orders&session=rt_...`.
5. Browser stores latest `eventId`, sends `{ "type": "ack", "messageId": "..." }`, and reconnects with a fresh session plus `lastEventId`.

Expected result: one session token opens one WebSocket only. Reused or expired sessions return `REALTIME_SESSION_INVALID`. Already connected sockets are not closed only because the session expires.

Hinglish:

1. Settings > Realtime API open karo.
2. Collection aur event types enable karo.
3. Trusted backend session create kare.
4. Browser `ws://HOST/api/realtime?schema=orders&session=rt_...` se connect kare.
5. Browser latest `eventId` store kare, `{ "type": "ack", "messageId": "..." }` bheje, aur fresh session plus `lastEventId` ke saath reconnect kare.

Expected result: ek session token sirf ek WebSocket open karta hai. Reused ya expired session `REALTIME_SESSION_INVALID` return karta hai. Already connected socket sirf session expire hone ki wajah se close nahi hota.

## Verified Commands

- `npx vitest run packages/server/tests/project-audit.test.ts`
- `npm run check`
- `npm run smoke`
- `npm audit --audit-level=high`
- `git diff --check`

## Current Gaps To Track Separately

English:

- Admin routes are MVP-style and do not yet enforce admin-session authorization at the HTTP route layer.
- Multi-tenant isolation is documented as product direction but not implemented yet.
- Media upload/storage is a schema field type but still needs a dedicated production file workflow.
- Realtime has session tokens and replay, but not durable per-client ack storage.

Hinglish:

- Admin routes abhi MVP-style hain aur HTTP route layer par admin-session authorization enforce nahi karte.
- Multi-tenant isolation product direction me documented hai, lekin abhi implemented nahi hai.
- Media upload/storage schema field type hai, lekin dedicated production file workflow abhi banana hai.
- Realtime me session tokens aur replay hai, lekin durable per-client ack storage abhi nahi hai.
