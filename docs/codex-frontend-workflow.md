# Codex Frontend Workflow

Use this guide when a developer asks Codex or another AI assistant to build a frontend feature backed by Apiagex.

Hinglish: Frontend feature banwana hai aur backend Apiagex se banana hai to ye flow use karo.

## Environment

Set secrets in your shell or ignored `.env` files only:

```bash
export APIAGEX_BASE_URL=http://127.0.0.1:4000
export APIAGEX_AUTOMATION_TOKEN=agx_auto_your_temporary_token
```

If you need to create a temporary token from the CLI, set the owner session token locally and run:

```bash
export APIAGEX_ADMIN_TOKEN=owner_session_token_from_login
apiagex ai token --ttl-minutes 60 --name "Codex frontend setup"
```

Never commit `APIAGEX_ADMIN_TOKEN`, `APIAGEX_AUTOMATION_TOKEN`, generated curl history, screenshots, or logs containing token values.

## Setup Check

```bash
apiagex ai context
apiagex ai doctor
curl "$APIAGEX_BASE_URL/api/health"
```

`apiagex ai doctor` prints whether token env vars are set, but it does not print token values.

## Prompt Template

```text
Build the product search UI in this frontend project.
Apiagex is my backend.
Read .apiagex/codex.md first.
Use APIAGEX_BASE_URL and APIAGEX_AUTOMATION_TOKEN from the environment.
Create any missing Apiagex schemas, workflow APIs, permissions, frontend API client code, and tests needed.
Preview risky backend changes before applying them.
Do not commit secrets or write token values into files.
After implementation, run the relevant frontend tests and call the created Apiagex routes.
```

## Expected Codex Actions

1. Read `.apiagex/codex.md`.
2. Check `GET $APIAGEX_BASE_URL/api/health`.
3. Inspect existing schemas, workflows, and custom routes.
4. Create only missing backend resources.
5. Prefer workflow APIs under `/api/custom` for feature-specific backend logic.
6. Set Custom API Permissions only for the required route and access mode.
7. Generate frontend client code that reads `APIAGEX_BASE_URL`.
8. Test created API routes and UI behavior.
9. Summarize backend resources, frontend files, and commands run.

Hinglish: Pehle context padhna, health check karna, existing backend dekhna, missing schema/workflow/permission banana, frontend wire karna, test chalana, aur summary dena.

## Verification

Use the commands that match the project:

```bash
apiagex ai doctor
curl "$APIAGEX_BASE_URL/api/health"
npm test
npm run build
```

For a created workflow route:

```bash
curl -X POST "$APIAGEX_BASE_URL/api/custom/YOUR_ROUTE" \
  -H "x-apiagex-automation-token: $APIAGEX_AUTOMATION_TOKEN" \
  -H "content-type: application/json" \
  -d '{"sample":true}'
```

If the route is public or role-token protected, verify the exact intended auth mode. Do not open a route to public unless the prompt or approved plan explicitly asks for public access.

## Rollback Tips

- Frontend changes: revert the feature branch or targeted files.
- Temporary token: revoke it from Admin API or Admin UI after use.
- Workflow API: deactivate the workflow before deleting it.
- Permission mistake: remove the specific Custom API Permission first.
- Schema mistake: delete only if no real entries depend on it; otherwise create a corrective schema/field migration.

## Short User Prompt

```text
Bhai is frontend feature ko Apiagex backend ke saath bana do.
.apiagex/codex.md read karo, env token use karo, backend me jo schema/workflow/API/permission chahiye bana do, secrets commit mat karna, test bhi chala dena.
```
