# Permission Scopes

## English

RBAC V2 uses one canonical permission grammar for every protected action:

```txt
<domain>[:<resource>][/<nested-resource>]
```

Actions are:

- `read`
- `create`
- `update`
- `delete`
- `execute`
- `manage`

These are the only canonical RBAC V2 actions. Legacy admin `write` checks remain a compatibility layer until the route guard migration is complete.

Scope domains:

- `system:roles` for role catalog management
- `system:users` for user and membership management
- `tenant:<tenantId>` for tenant administration
- `content-types:<contentTypeId>` for dynamic APIs
- `media-files` for media library access
- `webhooks` for outbound webhook management
- `backups` for export and restore flows
- `migrations` for schema history
- `audit-logs` for audit log reads
- `realtime` for live stream access
- `api:<method>:<path>` for explicit route-level allow/block

Examples:

```json
{
  "content-types:posts": {
    "create": true,
    "read": true,
    "update": false,
    "delete": false
  },
  "api:POST:/admin/backups/restore": {
    "execute": false
  }
}
```

Evaluation order:

1. Owner keeps bypass unless a future security review removes it.
2. Explicit route/API permission is checked first for protected routes.
3. Content-type scoped permissions are checked for dynamic APIs.
4. Built-in role defaults are fallback only when no catalog rule exists.
5. Explicit `false` must block fallback allows.
6. Missing permission is denied for sensitive admin APIs.

The evaluator keeps default-deny behavior and checks explicit catalog values before fallback values. If a catalog value is `false`, that deny wins over any fallback allow.
Existing content role catalog checks now pass through this evaluator while preserving `list` compatibility for current dynamic API routes.
Fastify routes can attach permission metadata with a scope/action pair before route guards consume it.

## Hindi

RBAC V2 har protected action ke liye ek canonical permission grammar use karega:

```txt
<domain>[:<resource>][/<nested-resource>]
```

Actions ye hain:

- `read`
- `create`
- `update`
- `delete`
- `execute`
- `manage`

Ye hi canonical RBAC V2 actions hain. Legacy admin `write` checks route guard migration complete hone tak compatibility layer rahenge.

Scope domains:

- `system:roles` role catalog management ke liye
- `system:users` user aur membership management ke liye
- `tenant:<tenantId>` tenant administration ke liye
- `content-types:<contentTypeId>` dynamic APIs ke liye
- `media-files` media library access ke liye
- `webhooks` outbound webhook management ke liye
- `backups` export aur restore flows ke liye
- `migrations` schema history ke liye
- `audit-logs` audit log reads ke liye
- `realtime` live stream access ke liye
- `api:<method>:<path>` exact route-level allow/block ke liye

Examples:

```json
{
  "content-types:posts": {
    "create": true,
    "read": true,
    "update": false,
    "delete": false
  },
  "api:POST:/admin/backups/restore": {
    "execute": false
  }
}
```

Evaluation order:

1. Owner bypass rahega jab tak future security review ise remove na kare.
2. Protected routes par explicit route/API permission pehle check hogi.
3. Dynamic APIs ke liye content-type scoped permissions check hongi.
4. Built-in role defaults sirf fallback honge jab catalog rule missing ho.
5. Explicit `false` fallback allow ko block karega.
6. Sensitive admin APIs par missing permission deny hogi.

Evaluator fallback values se pehle explicit catalog values check karta hai. Agar catalog value `false` hai to vo deny kisi bhi fallback allow se jeetega.
Existing content role catalog checks ab isi evaluator se pass hote hain aur current dynamic API routes ke liye `list` compatibility preserve karte hain.
Fastify routes scope/action pair ke saath permission metadata attach kar sakte hain, jise route guards baad me consume karenge.
