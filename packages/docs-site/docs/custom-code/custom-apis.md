# Custom API Code

Use custom code when generated CRUD is not enough.

Custom APIs should live in the project created by `create-apiagex`, not inside installed package internals.

## Typical Responsibilities

- Register project routes as relative paths such as `/health`, `/orders/:entryId/pay`, or `/reports/orders`.
- Let Apiagex mount those routes under `/api/custom/...` automatically.
- Validate request bodies.
- Use the `apiagex` helper context for schemas, entries, roles, realtime sessions, users, and direct database access when needed.
- Check API role permissions when the route is meant for client use.
- Avoid printing secrets or tokens in logs.

::: tip Route Prefix
Do not write `/api/custom` in `app.get()` or `app.post()` for new project custom routes. Write `/orders/:entryId/pay`; clients call `/api/custom/orders/:entryId/pay`.
:::

## Register Custom Routes

In a TypeScript project, `src/custom-routes.ts` exports `registerCustomRoutes`.

```ts
import type { RegisterApiagexCustomRoutes } from "@apiagex/server";

type PayOrderParams = {
  entryId: string;
};

type OrderData = {
  status: "pending" | "paid" | "cancelled";
  paymentStatus?: "pending" | "paid" | "failed";
};

export const registerCustomRoutes: RegisterApiagexCustomRoutes = async (app, apiagex) => {
  app.get("/health", async () => ({
    ok: true,
    service: "custom-api",
  }));

  app.get("/schema-count", async () => ({
    ok: true,
    count: (await apiagex.schemas.list()).length,
  }));

  app.post<{ Params: PayOrderParams }>("/orders/:entryId/pay", async (request, reply) => {
    const entry = await apiagex.entries.getById(request.params.entryId);
    if (!entry) return reply.code(404).send({ ok: false, error: "ORDER_NOT_FOUND" });

    const data = entry.data as OrderData;
    if (data.status !== "pending") {
      return reply.code(400).send({ ok: false, error: "ORDER_NOT_PAYABLE" });
    }

    return {
      ok: true,
      entry: await apiagex.entries.update(entry.id, {
        data: { ...data, status: "paid", paymentStatus: "paid" },
      }),
    };
  });
};
```

Clients call these mounted routes:

```text
GET  /api/custom/health
GET  /api/custom/schema-count
POST /api/custom/orders/:entryId/pay
```

## What `apiagex` Gives You

The second argument, `apiagex`, is the safe project helper context. It keeps custom code close to Apiagex's real schema, entry, role, realtime, user, and database model.

| Helper | Use |
| --- | --- |
| `apiagex.schemas.list()` | List all schemas. |
| `apiagex.schemas.getById(schemaId)` | Read one schema by id. |
| `apiagex.schemas.getBySlug("orders")` | Read one schema by slug. |
| `apiagex.schemas.create(input)` | Create a schema from code. |
| `apiagex.entries.getById(entryId)` | Read an entry when you only have the entry id. |
| `apiagex.entries.getById("orders", entryId)` | Typed read by schema slug in generated TypeScript projects. |
| `apiagex.entries.list("orders")` | List entries for a schema slug. |
| `apiagex.entries.query("orders", options)` | Query entries with `fields`, search/limit/offset style options. |
| `apiagex.entries.create("orders", { data })` | Create an entry for a schema slug. |
| `apiagex.entries.update(entryId, { data })` | Update an entry by id. |
| `apiagex.entries.update("orders", entryId, { data })` | Typed update by schema slug. |
| `apiagex.entries.delete(entryId)` | Delete an entry by id. |
| `apiagex.roles.list()` | List API roles. |
| `apiagex.roles.canAccess(roleId, schemaId, action)` | Check generated API permission. |
| `apiagex.roles.createToken(roleId, { name })` | Create an API token for a role. |
| `apiagex.roles.resolveToken(token)` | Resolve a raw token to its stored token record. |
| `apiagex.realtime.createSession(input)` | Create a realtime session token from custom code. |
| `apiagex.users.create(input)` | Create an API/control user record. |
| `apiagex.database` | Low-level database adapter for advanced cases. Prefer helpers first. |

Hinglish: `app` Fastify route banane ke liye hai. `apiagex` se schema, entry, role, realtime, user, database sab milta hai. Pehle helpers use karo; direct database tab use karo jab helper se kaam na ho.

## Typed Schema Helpers

After creating or changing schemas in a TypeScript project, run:

```bash
npm run types
```

That writes `src/apiagex-types.ts`, so `RegisterApiagexCustomRoutes` gets schema slug and field autocomplete.

```ts
app.get("/orders", async () => {
  const result = await apiagex.entries.query("orders", {
    fields: ["status", "paymentStatus"],
    limit: 50,
    offset: 0,
  });

  return {
    ok: true,
    total: result.total,
    entries: result.entries,
  };
});
```

## Permission Flow

Code custom routes are blocked by default for clients.

1. Write route as `/orders/:entryId/pay`.
2. Restart the server.
3. Apiagex discovers it as `POST /api/custom/orders/:entryId/pay`.
4. Open `/adminui/#settings/custom-api-permissions`.
5. Allow the route for `public` or for a token role.
6. Call the route from the frontend.

```bash
curl -X POST http://127.0.0.1:4000/api/custom/orders/ENTRY_ID/pay \
  -H "authorization: Bearer <TOKEN>"
```

## More Examples

### Create Entry From Custom Code

```ts
app.post("/orders", async (request, reply) => {
  const body = request.body as { table: string; total: number };
  if (!body.table || !Number.isFinite(body.total)) {
    return reply.code(400).send({ ok: false, error: "ORDER_INVALID" });
  }

  return {
    ok: true,
    entry: await apiagex.entries.create("orders", {
      data: {
        table: body.table,
        total: body.total,
        status: "pending",
      },
    }),
  };
});
```

### Read Schema Before Work

```ts
app.get("/orders/schema", async (request, reply) => {
  const schema = await apiagex.schemas.getBySlug("orders");
  if (!schema) return reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });

  return {
    ok: true,
    fields: schema.fields,
  };
});
```

### Create Realtime Session From Custom Code

```ts
app.post("/orders/realtime-session", async (request, reply) => {
  const roleId = request.headers["x-role-id"];
  if (typeof roleId !== "string") {
    return reply.code(400).send({ ok: false, error: "ROLE_REQUIRED" });
  }

  const schema = await apiagex.schemas.getBySlug("orders");
  if (!schema) return reply.code(404).send({ ok: false, error: "SCHEMA_NOT_FOUND" });

  return {
    ok: true,
    realtime: await apiagex.realtime.createSession({
      roleId,
      schemaId: schema.id,
      schemaSlug: schema.slug,
      ttlSeconds: 120,
    }),
  };
});
```

::: warning Verify Against Starter
This page must be kept aligned with `create-apiagex` starter output and `@apiagex/server` custom route types.
:::
