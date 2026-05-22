# Codex Project Integration

This guide explains how Codex should work inside a frontend or app project that uses Apiagex as its backend. The goal is simple: Codex can build the frontend feature and, when backend APIs are needed, create them through Apiagex instead of asking the developer to hand-build every schema and workflow.

Ye guide batata hai ki jis project me Apiagex backend installed hai, usme Codex kaise kaam kare. Goal simple hai: Codex frontend feature banaye aur backend API chahiye ho to Apiagex se schema, workflow API, permission, aur test calls bana le.

## Project Discovery

Generated Apiagex projects should include a concise Codex context file at `.apiagex/codex.md`. Codex should read that file before creating backend resources. The file must describe:

- Apiagex base URL, usually `http://127.0.0.1:4000`.
- Environment variable names for automation, especially `APIAGEX_BASE_URL` and `APIAGEX_AUTOMATION_TOKEN`.
- Safe commands for local checks, such as `npm run dev`, `npm run smoke`, and `apiagex ai doctor`.
- The rule that raw tokens must never be committed.
- Practical examples for schema, workflow route, permission, and frontend fetch calls.

Hinglish: Generated project me `.apiagex/codex.md` hona chahiye. Codex pehle ye file padhe, phir backend resources create kare. Isme base URL, token env vars, safe commands, no-commit-token rule, aur practical API examples hone chahiye.

## Environment Contract

Codex-facing tools should use these environment variables:

```bash
APIAGEX_BASE_URL=http://127.0.0.1:4000
APIAGEX_AUTOMATION_TOKEN=agx_auto_example_do_not_commit
```

`APIAGEX_BASE_URL` points to the running Apiagex backend. `APIAGEX_AUTOMATION_TOKEN` is a temporary token created by the owner/admin for AI automation. It should be set in the shell, Codex environment, or a local ignored file only.

Hinglish: `APIAGEX_BASE_URL` running backend par point karta hai. `APIAGEX_AUTOMATION_TOKEN` temporary AI automation token hai. Isko shell/env me rakho, committed file me nahi.

## Temporary Automation Token Contract

Automation tokens are for AI setup work only. They are different from content API tokens. They should be short-lived, scoped, revocable, hashed in storage, and visible only once when created.

Default scopes:

- `schemas:manage`: create and inspect schemas needed by a feature.
- `workflows:manage`: create and test workflow APIs under `/api/custom`.
- `permissions:manage`: allow a workflow route for public or a content API role.
- `routes:read`: inspect generated custom/API routes.
- `plans:apply`: preview/apply a validated multi-resource AI API plan.

Recommended defaults:

- TTL: 60 minutes.
- Name: short purpose such as `Codex product search`.
- Storage: SHA-256 hash plus visible token prefix only.
- Audit: created by owner/admin, created time, expiry, last used, revoked time.

Admin endpoints:

- `GET /api/admin/automation-tokens`: list token metadata only.
- `POST /api/admin/automation-tokens`: create a token with `name`, `scopes`, and `ttlMinutes`; returns the raw `token` once.
- `DELETE /api/admin/automation-tokens/:tokenId`: revoke a token.

Hinglish: Automation token AI setup ke liye hai, content API token se alag. Iska TTL short, scope limited, revoke support, hashed storage, aur one-time visible secret hona chahiye.

## What Codex Can Do

With a valid automation token, Codex may:

1. Check backend health.
2. List current schemas, workflows, and custom API routes.
3. Propose or create schemas needed by the frontend feature.
4. Create workflow APIs under `/api/custom`.
5. Run workflow test calls.
6. Set custom API permissions for public or role-protected access.
7. Generate frontend API client code and tests.
8. Summarize what it changed.

Hinglish: Valid token ke saath Codex health check, schemas/workflows list, needed schemas create, workflow APIs create, test run, permissions set, frontend client code, aur change summary kar sakta hai.

## Safety Limits

Codex must not:

- Ask for permanent owner credentials when a temporary automation token is available.
- Store raw tokens in source files, README examples, screenshots, logs, or commits.
- Use direct database access for project automation.
- Create arbitrary JavaScript workflow nodes.
- Open workflow APIs to public unless the prompt or plan explicitly asks for public access.
- Delete existing schemas, entries, workflows, or permissions unless the developer explicitly asks.

Hinglish: Codex permanent owner credentials na maange, raw token commit na kare, direct DB access na use kare, arbitrary JS workflow node na banaye, aur public permission sirf explicit approval par de.

## Recommended Codex Prompt

```text
Build the product search UI. Apiagex is my backend.
Use APIAGEX_BASE_URL and APIAGEX_AUTOMATION_TOKEN from the environment.
Create any schemas, workflow APIs, permissions, tests, and frontend API calls needed.
Preview risky backend changes before applying them and do not commit secrets.
```

## Expected Backend Flow

1. Read `.apiagex/codex.md`.
2. Call Apiagex health and route discovery.
3. Inspect existing schemas/workflows before creating anything.
4. Build an AI API plan when multiple resources are needed.
5. Validate the plan.
6. Apply only the approved or clearly requested changes.
7. Run test calls against created routes.
8. Wire the frontend to the created route.

Hinglish: Pehle context padho, health/routes check karo, existing resources inspect karo, plan banao, validate karo, apply karo, test route call karo, phir frontend wire karo.

## Future Native Admin UI AI Builder

The Admin UI AI Builder is tracked separately in `task36pending.md`. This project integration is the first layer: Codex and other AI clients can work from the developer project using temporary tokens and MCP/tools.

Hinglish: Admin UI ke andar AI Builder alag later task hai. Pehle layer ye hai ki Codex project ke andar temporary token aur MCP/tools se Apiagex control kar sake.
