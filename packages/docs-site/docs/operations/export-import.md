# Export And Import

Export/import is for moving project structure between environments.

## What Should Be Exported

- Schemas
- Fields
- Field options
- Relations
- API roles
- API permissions
- Custom API/workflow definitions when supported
- Realtime/webhook configuration without secrets when supported

## What Must Not Be Exported

- Real token values
- Owner password hashes
- Database passwords
- Webhook secrets
- Uploaded binary files unless a future asset export task adds that
- Production entries unless an explicit content export task adds that

::: warning Current Status
Admin UI export/import should be treated as a structured feature area. If a specific export/import control is not implemented in your version, treat it as planned and use documented project-template behavior only.
:::
