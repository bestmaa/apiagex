# MCP Tools

Apiagex MCP-style automation tools let AI clients inspect and change backend structure safely with temporary automation tokens.

## Tool Areas

| Area | Purpose |
| --- | --- |
| Health | Confirm Apiagex server is reachable. |
| Schemas | Create/list schemas and fields. |
| Routes | Discover generated and custom routes. |
| Workflow APIs | Create/test workflow-backed custom APIs. |
| Permissions | Allow generated or custom APIs for roles. |
| Summary | Export project structure without secrets. |

## Fallback Behavior

If no exact MCP tool exists for a workflow, Codex can still read the package docs, inspect project code, and use normal API routes, as long as it has a valid temporary token and the action is allowed.

::: danger Secrets
MCP output must never include plaintext tokens, passwords, database URLs, or webhook secrets.
:::
