# API Management UI

Open:

```text
/adminui/#apis
```

API Management gives a practical map of generated APIs and custom endpoints.

<div class="screen">
  <img src="/screenshots/apis/api-management-list.png" alt="Apiagex API Management overview">
</div>

## Pages

| Page | Route | Use |
| --- | --- | --- |
| APIs | `/adminui/#apis` | API cards, generated API list, selected API details. |
| Endpoints | `/adminui/#apis/endpoints` | Endpoint catalog by schema. |
| API Keys | `/adminui/#settings/api-tokens` | Create content API tokens. |
| Webhooks | `/adminui/#settings/webhooks` | Manage webhook destinations. |
| Logs | `/adminui/#apis/logs` | Inspect JSONL request logs. |
| Settings | `/adminui/#settings/api-docs` | Enable/disable OpenAPI and Swagger. |

## Endpoint Catalog

<div class="screen">
  <img src="/screenshots/apis/endpoints-catalog.png" alt="Apiagex endpoint catalog">
</div>

## Logs

Runtime API request logs are written to rotating JSONL files, not the database.

Default logs cover generated content API and custom API traffic without request bodies or token values.

<div class="screen">
  <img src="/screenshots/apis/api-logs.png" alt="Apiagex API logs screen">
</div>
