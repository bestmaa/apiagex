# Workflow APIs

Workflow APIs are no-code or low-code custom APIs managed through Admin UI when the workflow builder is enabled.

Open:

```text
/adminui/#settings/workflows
```

<div class="screen">
  <img src="/screenshots/custom/workflows.png" alt="Apiagex workflow custom API screen">
</div>

## Flow

1. Create a workflow API.
2. Set method and route under `/api/custom/...`.
3. Add safe steps.
4. Test run.
5. Activate.
6. Allow the custom API permission for the API role that should call it.
7. Call the route with a token.

Planned OTP, Google login, password, external HTTP, secret store, and graph editor work must be marked planned until implemented in the runtime.

::: warning Planned Boundaries
Only document workflow nodes that exist in the current runtime as available. Keep future OTP, Google login, password, secret-store, external HTTP, and graph-editor work marked as planned until implemented.
:::
