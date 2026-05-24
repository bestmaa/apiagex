# Webhooks

Open:

```text
/adminui/#settings/webhooks
```

<div class="screen">
  <img src="/screenshots/webhooks/webhooks.png" alt="Apiagex webhook settings screen">
</div>

Webhooks send content change events to external services.

## Setup Flow

1. Open Webhooks.
2. Create a webhook destination URL.
3. Choose events or schemas if the UI exposes filters.
4. Save.
5. Trigger a matching content change.
6. Inspect deliveries.

## Receiver Safety

Webhook deliveries include signing metadata. Receivers should verify:

- timestamp tolerance
- delivery id replay prevention
- HMAC signature
- expected event type

Do not log webhook secrets.

::: tip Hinglish
Webhook receiver app me signature verify karo. Secret ko logs/docs/screenshots me kabhi expose mat karo.
:::
