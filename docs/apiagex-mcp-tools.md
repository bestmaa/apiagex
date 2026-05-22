# Apiagex MCP Tools

This contract defines the MCP tools an AI client can use to control Apiagex through secure HTTP APIs. Tools must use `APIAGEX_BASE_URL` and `APIAGEX_AUTOMATION_TOKEN`; they must not read or write the Apiagex database directly.

Hinglish: MCP tools Apiagex ko secure HTTP API se control karenge. Direct database access nahi hoga.

## Environment

- `APIAGEX_BASE_URL`: Apiagex server base URL, for example `http://127.0.0.1:4000`.
- `APIAGEX_AUTOMATION_TOKEN`: temporary automation token created by `apiagex ai token` or Admin API.

Token errors must be clear, but token values must never be printed.

## Runtime Command

Generated projects and installed runtime packages expose the MCP server as:

```bash
APIAGEX_BASE_URL=http://127.0.0.1:4000 \
APIAGEX_AUTOMATION_TOKEN=agx_auto_your_temporary_token \
apiagex mcp
```

The command speaks JSON-RPC over stdio and exposes the tools listed below. It uses only Apiagex HTTP APIs under `/api/health` and `/api/ai/*`.

## Tool Contract

### `apiagex.health`

- Scope: none.
- Input: `{}`.
- Action: call Apiagex health.
- Output: `{ ok, service, baseUrl }`.

### `apiagex.list_schemas`

- Scope: `schemas:manage`.
- Input: `{}`.
- Action: list existing schemas before creating anything.
- Output: schema summaries with `id`, `name`, `slug`, and `fieldCount`.

### `apiagex.create_schema`

- Scope: `schemas:manage`.
- Input: `name`, `slug`, optional `description`, and `fields`.
- Action: create one missing content schema.
- Output: created schema summary.
- Safety: prefer additive schema creation; do not delete or overwrite existing schemas.

### `apiagex.create_workflow_api`

- Scope: `workflows:manage`.
- Input: `name`, HTTP `method`, `path`, optional `description`, optional `active`, and workflow `definition`.
- Action: create a workflow-backed custom API.
- Output: workflow summary with `id`, `method`, `path`, and `active`.
- Safety: workflows start inactive unless the caller explicitly asks for `active: true`.

### `apiagex.test_workflow`

- Scope: `workflows:manage`.
- Input: `workflowId` or `method` plus `path`, optional `headers`, and optional `body`.
- Action: run or call the workflow test path.
- Output: `ok`, `statusCode`, and response `body`.

### `apiagex.list_routes`

- Scope: `routes:read`.
- Input: `{}`.
- Action: list custom API/workflow routes and permission keys.
- Output: route summaries with method, path, permission key, and active state.

### `apiagex.set_permission`

- Scope: `permissions:manage`.
- Input: `permissionKey`, `roleId`, and `allowed`.
- Action: set Custom API Permission for one route and one role.
- Output: saved permission summary.
- Safety: public access must be represented by an explicit role and only applied when requested or approved.

### `apiagex.export_summary`

- Scope: `routes:read`.
- Input: `{}`.
- Action: export a concise markdown summary of schemas, workflow APIs, routes, and permissions touched by the tool session.
- Output: `{ ok, markdown }`.

## Safety Rules

- Use `x-apiagex-automation-token` or the agreed bearer/header form for automation auth.
- Do not store raw tokens in MCP config, generated files, logs, or tool outputs.
- Do not use owner credentials when a temporary automation token is available.
- Do not delete schemas, entries, workflows, or permissions unless the developer explicitly asks.
- Preview multi-resource plans before applying them.
