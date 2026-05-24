# Owner Login And Admin Shell

Open the Admin UI:

```text
http://127.0.0.1:4000/adminui
```

The first owner is created from the owner form. After that, the same form logs in the owner account.

<div class="screen">
  <img src="/screenshots/admin-ui/owner-login.png" alt="Apiagex owner login screen">
</div>

After login, the Admin UI shell gives you the sidebar, route heading, search, theme toggle, and account controls.

<div class="screen">
  <img src="/screenshots/admin-ui/dashboard-shell.png" alt="Apiagex Admin UI dashboard shell">
</div>

## Sidebar Map

| Sidebar Item | Route | Use |
| --- | --- | --- |
| Dashboard | `/adminui/#dashboard` | Workspace status and quick actions. |
| Content | `/adminui/#entries` | Create and edit entries. |
| Schema Builder | `/adminui/#schemas` | Create schemas and fields. |
| Templates | `/adminui/#settings/project-template` | Export/import structure. |
| Media | `/adminui/#entries` | Entry media fields and uploaded file URLs. |
| Users | `/adminui/#users` | API users and role assignment. |
| API Management > APIs | `/adminui/#apis` | Generated API overview. |
| API Management > Endpoints | `/adminui/#apis/endpoints` | Endpoint catalog. |
| API Management > API Keys | `/adminui/#settings/api-tokens` | Create content API tokens. |
| API Management > Webhooks | `/adminui/#settings/webhooks` | Manage webhooks. |
| API Management > Logs | `/adminui/#apis/logs` | Read JSONL API request logs. |
| API Management > Settings | `/adminui/#settings/api-docs` | Swagger/OpenAPI visibility. |
| System | `/adminui/#platform` | Platform and tenant preview controls. |
| Settings | `/adminui/#settings` | Roles, permissions, tokens, realtime, workflows. |

## Click Flow

1. Open `/adminui`.
2. Login as owner.
3. Use the left sidebar to open `Schema Builder`.
4. Use `API Management` after schemas exist.
5. Use `Settings` for roles, tokens, webhooks, realtime, workflows, and docs settings.

::: tip Hinglish
Left sidebar se hi kaam start hota hai. Schema Builder se backend structure banao, Content se data bharo, API Management se routes dekho, aur Settings se permissions/tokens manage karo.
:::
