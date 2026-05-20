# Workflow API Builder Scope

This document defines the planned Workflow API Builder for Apiagex. It is a product and architecture contract only. It does not mean the runtime exists yet.

Ye document Apiagex ke planned Workflow API Builder ka product aur architecture contract define karta hai. Iska matlab ye nahi hai ki runtime abhi implement ho gaya hai.

## Goal

### English

Workflow API Builder will let an admin create custom business APIs from Admin UI without writing TypeScript code for common backend flows.

Examples:

- public user register API
- OTP request and verify API
- Google login callback API
- order status update API
- kitchen-board workflow API
- report API
- approval workflow API

The builder should complement code-based custom APIs. Developers can still write `src/custom-routes.ts` when they need full control.

### Hinglish

Workflow API Builder admin ko Admin UI se custom business APIs banane dega bina TypeScript code likhe, common backend flow ke liye.

Examples:

- public user register API
- OTP request aur verify API
- Google login callback API
- order status update API
- kitchen-board workflow API
- report API
- approval workflow API

Builder code-based custom APIs ko replace nahi karega. Jaha full control chahiye, developer `src/custom-routes.ts` me code likh sakta hai.

## Route Model

### English

Every workflow API must mount under the secure custom API namespace:

```txt
Admin enters: POST /register
Apiagex serves: POST /api/custom/register
```

This keeps workflow APIs consistent with code custom APIs. Workflow routes should be discovered into the existing Custom API Permissions registry.

### Hinglish

Har workflow API secure custom API namespace ke under mount hogi:

```txt
Admin enters: POST /register
Apiagex serves: POST /api/custom/register
```

Isse workflow APIs aur code custom APIs same tarah manage honge. Workflow routes existing Custom API Permissions registry me discover honi chahiye.

## Permission Model

### English

Workflow APIs are blocked by default.

Calling clients must have one of these:

- an API token whose content role is allowed for that workflow route
- public role allowed for that workflow route

Owner/admin control-plane sessions do not bypass workflow API client permissions. Admin sessions can create and test workflows from Admin UI, but public/client calls still use the Custom API Permissions system.

### Hinglish

Workflow APIs default me blocked rahengi.

Client call ke liye inme se ek chahiye:

- API token jiska content role us workflow route ke liye allowed ho
- public role us workflow route ke liye allowed ho

Owner/admin control-plane session workflow API client permissions ko bypass nahi karega. Admin session Admin UI se workflow create/test kar sakta hai, lekin public/client call Custom API Permissions system se hi chalega.

## MVP Node Types

### English

The first workflow runtime should support a small safe set of nodes:

- Route trigger: method and path for the workflow API
- Validate body: required fields, basic types, email, length, enum
- Query entries: list content entries by schema slug with search, limit, offset, and simple filters
- Get entry: read one content entry by id
- Create entry: create content data in a schema
- Update entry: update one content entry
- Delete entry: delete one content entry when explicitly configured
- If/else: branch on simple conditions
- Set variable: store intermediate values
- Return response: set HTTP status and response body

Later nodes can include HTTP request, email/SMS, hash password, verify password, issue app token, webhook emit, and realtime emit.

### Hinglish

Pehle workflow runtime me chhota aur safe node set hona chahiye:

- Route trigger: workflow API ka method aur path
- Validate body: required fields, basic types, email, length, enum
- Query entries: schema slug se content entries list karna with search, limit, offset, simple filters
- Get entry: id se one content entry read karna
- Create entry: schema me content data create karna
- Update entry: one content entry update karna
- Delete entry: explicitly configured ho to one content entry delete karna
- If/else: simple conditions par branch karna
- Set variable: intermediate values store karna
- Return response: HTTP status aur response body set karna

Later nodes me HTTP request, email/SMS, hash password, verify password, issue app token, webhook emit, aur realtime emit aa sakte hain.

## Expression Model

### English

Workflow values should use a safe template syntax:

```txt
{{body.email}}
{{params.entryId}}
{{query.search}}
{{steps.findUser.entries.0.id}}
{{vars.total}}
```

Allowed roots should be limited to request data, step outputs, and workflow variables. The MVP must not use `eval`, `new Function`, or arbitrary JavaScript execution.

### Hinglish

Workflow values safe template syntax use karenge:

```txt
{{body.email}}
{{params.entryId}}
{{query.search}}
{{steps.findUser.entries.0.id}}
{{vars.total}}
```

Allowed roots sirf request data, step outputs, aur workflow variables tak limited hone chahiye. MVP me `eval`, `new Function`, ya arbitrary JavaScript execution nahi hoga.

## Storage Model

### English

Workflows should be stored in the database as validated JSON definitions with metadata:

- id
- name
- method
- path
- active
- description
- definition version
- workflow JSON
- createdAt and updatedAt
- createdBy and updatedBy when available

Runtime should load active workflows and register them under `/api/custom`.

### Hinglish

Workflows database me validated JSON definitions ke roop me metadata ke saath store hone chahiye:

- id
- name
- method
- path
- active
- description
- definition version
- workflow JSON
- createdAt aur updatedAt
- createdBy aur updatedBy jab available ho

Runtime active workflows load karega aur `/api/custom` ke under register karega.

## Workflow JSON Contract

### English

The initial saved workflow contract should use versioned JSON:

```json
{
  "version": 1,
  "route": {
    "method": "POST",
    "path": "/register"
  },
  "startNodeId": "validate-body",
  "nodes": [
    {
      "id": "validate-body",
      "type": "validateBody",
      "label": "Validate request",
      "config": {
        "required": ["email", "password"]
      },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "return-created",
      "type": "returnResponse",
      "label": "Return created",
      "config": {
        "status": 201,
        "body": { "ok": true }
      },
      "position": { "x": 320, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "validate-to-return",
      "from": "validate-body",
      "to": "return-created"
    }
  ]
}
```

Rules:

- `version` starts at `1` so future migrations can transform workflow JSON safely.
- `route.method` supports `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- `route.path` is the admin-entered custom route path and must mount under `/api/custom`.
- `startNodeId` points to the first executable node.
- Every node must have a stable `id`, `type`, and JSON-safe `config`.
- `edges` connect node ids and prepare the contract for the later graph editor.
- `position` is optional and only for Admin UI graph layout.

### Hinglish

Initial saved workflow contract versioned JSON use karega:

```json
{
  "version": 1,
  "route": {
    "method": "POST",
    "path": "/register"
  },
  "startNodeId": "validate-body",
  "nodes": [
    {
      "id": "validate-body",
      "type": "validateBody",
      "label": "Validate request",
      "config": {
        "required": ["email", "password"]
      },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "return-created",
      "type": "returnResponse",
      "label": "Return created",
      "config": {
        "status": 201,
        "body": { "ok": true }
      },
      "position": { "x": 320, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "validate-to-return",
      "from": "validate-body",
      "to": "return-created"
    }
  ]
}
```

Rules:

- `version` `1` se start hoga taaki future me workflow JSON safely migrate ho sake.
- `route.method` `GET`, `POST`, `PUT`, `PATCH`, aur `DELETE` support karega.
- `route.path` admin-entered custom route path hai aur `/api/custom` ke under mount hona chahiye.
- `startNodeId` first executable node ko point karta hai.
- Har node ka stable `id`, `type`, aur JSON-safe `config` hoga.
- `edges` node ids connect karte hain aur later graph editor ke liye contract ready rakhte hain.
- `position` optional hai aur sirf Admin UI graph layout ke liye hai.

## Admin UI Plan

### English

Build Admin UI in two stages:

1. Simple list/form builder
   - workflow list
   - create/edit basics
   - ordered step form editor
   - schema and field pickers
   - test run panel
   - activation controls

2. Graph editor
   - React Flow canvas
   - visual nodes and edges
   - node config panel
   - validation overlay
   - auto-layout

The form builder should come first because it is easier to test and safer for the runtime contract.

### Hinglish

Admin UI do stages me banana chahiye:

1. Simple list/form builder
   - workflow list
   - create/edit basics
   - ordered step form editor
   - schema aur field pickers
   - test run panel
   - activation controls

2. Graph editor
   - React Flow canvas
   - visual nodes aur edges
   - node config panel
   - validation overlay
   - auto-layout

Form builder pehle banana chahiye kyunki ye test karna easy hai aur runtime contract ke liye safer hai.

## Safety Limits

### English

MVP workflows must have guardrails:

- no arbitrary JavaScript execution
- max step count
- execution timeout
- response size limit
- query limit
- safe error responses
- redacted headers and secrets in history
- no plain secrets inside workflow JSON
- disabled workflows are not callable
- active workflows still need Custom API Permissions

### Hinglish

MVP workflows me guardrails honi chahiye:

- arbitrary JavaScript execution nahi
- max step count
- execution timeout
- response size limit
- query limit
- safe error responses
- history me headers aur secrets redacted
- workflow JSON me plain secrets nahi
- disabled workflows callable nahi
- active workflows ko bhi Custom API Permissions chahiye

## Templates

### English

Templates should be added after storage, runtime, permissions, and Admin UI basics are stable.

Initial templates:

- Register user
- OTP login plan
- Google login plan
- Order status update
- Report API

Auth templates must not recommend plain password storage or fake OAuth verification.

### Hinglish

Templates tab add karne chahiye jab storage, runtime, permissions, aur Admin UI basics stable ho jaye.

Initial templates:

- Register user
- OTP login plan
- Google login plan
- Order status update
- Report API

Auth templates plain password storage ya fake OAuth verification recommend nahi kar sakte.

## Non Goals For MVP

### English

These are not part of the first workflow MVP:

- arbitrary code node
- unrestricted external HTTP calls
- marketplace templates
- secret value export
- replacing code-based custom routes
- advanced loops
- long-running background jobs

### Hinglish

Ye first workflow MVP ka part nahi hain:

- arbitrary code node
- unrestricted external HTTP calls
- marketplace templates
- secret value export
- code-based custom routes ko replace karna
- advanced loops
- long-running background jobs

## Release Rule

### English

Workflow Builder should not be published as complete until:

- storage works on SQLite, PostgreSQL, and MySQL
- runtime route execution is tested
- custom permissions block and allow correctly
- Swagger/OpenAPI shows active workflow APIs
- Admin UI create/test/activate flow works
- docs show a practical end-to-end example

### Hinglish

Workflow Builder ko complete publish tabhi maana jayega jab:

- storage SQLite, PostgreSQL, aur MySQL par chale
- runtime route execution tested ho
- custom permissions block aur allow sahi kare
- Swagger/OpenAPI active workflow APIs dikhaye
- Admin UI create/test/activate flow chale
- docs practical end-to-end example dikhaye
