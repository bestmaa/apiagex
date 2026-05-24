# Screenshot Checklist

Use Browser to capture Admin UI screenshots against local `/adminui`.

## Rules

- Use demo data only.
- Use desktop viewport such as `1600x1000`.
- Capture mobile only where layout changes matter.
- Do not show real tokens, passwords, private emails, database URLs, webhook secrets, or production data.
- Save raw images under `packages/docs-site/public/screenshots/...`.
- Save annotated copies with `-annotated.png`.

## Required Screenshots

| Page | Route | State | Filename |
| --- | --- | --- | --- |
| Owner login | `/adminui` | Login form | `admin-ui/owner-login.png` |
| Admin shell | `/adminui/#dashboard` | Logged-in dashboard | `admin-ui/dashboard-shell.png` |
| Schema builder | `/adminui/#schemas` | Empty/new schema | `schema/schema-builder-empty.png` |
| Schema field | `/adminui/#schemas` | Field options visible | `schema/field-options.png` |
| Entries | `/adminui/#entries` | Entry form | `entries/create-entry-form.png` |
| Media | `/adminui/#entries` | File/image field | `entries/media-field.png` |
| API list | `/adminui/#apis` | API overview | `apis/api-management-list.png` |
| Endpoints | `/adminui/#apis/endpoints` | Endpoint catalog | `apis/endpoints-catalog.png` |
| Logs | `/adminui/#apis/logs` | Logs table | `apis/api-logs.png` |
| API roles | `/adminui/#settings/content-roles` | Role cards and counts | `security/content-roles.png` |
| API tokens | `/adminui/#settings/api-tokens` | Token form before creation | `security/api-tokens.png` |
| Automation tokens | `/adminui/#settings/automation-tokens` | Token form before creation | `security/automation-tokens.png` |
| Webhooks | `/adminui/#settings/webhooks` | Webhook list/form | `webhooks/webhooks.png` |
| Realtime | `/adminui/#settings/realtime` | Realtime settings | `realtime/realtime-settings.png` |
| Workflows | `/adminui/#settings/workflows` | Workflow list/form | `custom/workflows.png` |

## Annotation Guidance

Use arrows or labels only when the click target is not obvious. Always describe the route and click target in text as well.
