# Webhooks

## English

Apiagex emits webhook events from the same audit trail that records content changes.

Available event names:

- `content-types.create`
- `content-types.update`
- `content-types.delete`
- `content-fields.create`
- `content-fields.update`
- `content-fields.delete`
- `content-entries.create`
- `content-entries.update`
- `content-entries.delete`
- `media-files.create`
- `media-files.update`
- `media-files.delete`

Manage webhook targets through `/admin/webhooks`.

Each delivery is stored in the database and exposed at `/admin/webhooks/:id/deliveries`.

Failed deliveries retry with backoff, and each delivery row tracks attempt count, status, and next retry time.

Webhook filters are optional. If filters are empty, old behavior is preserved and every selected event name is delivered.
When filters are present, delivery is limited by content type and action:

```json
{
  "filters": {
    "contentTypeIds": ["articles"],
    "actions": ["create", "update", "delete"]
  }
}
```

If a webhook has a `secret`, each delivery includes `x-apiagex-signature`, an HMAC SHA-256 signature of the JSON request body.

## Hindi

Apiagex webhook events content changes wale audit trail se emit karta hai.

Available event names:

- `content-types.create`
- `content-types.update`
- `content-types.delete`
- `content-fields.create`
- `content-fields.update`
- `content-fields.delete`
- `content-entries.create`
- `content-entries.update`
- `content-entries.delete`
- `media-files.create`
- `media-files.update`
- `media-files.delete`

Webhook targets `/admin/webhooks` se manage karo.

Har delivery database me store hoti hai aur `/admin/webhooks/:id/deliveries` par available hoti hai.

Failed deliveries backoff ke saath retry hoti hain, aur har delivery row attempt count, status, aur next retry time track karti hai.

Webhook filters optional hain. Agar filters empty hain to old behavior preserve hota hai aur selected event names ke sab events deliver hote hain.
Filters present hon to delivery content type aur action ke hisaab se limited hoti hai:

```json
{
  "filters": {
    "contentTypeIds": ["articles"],
    "actions": ["create", "update", "delete"]
  }
}
```

Agar webhook me `secret` hai, to har delivery me `x-apiagex-signature` header aata hai. Ye JSON request body ka HMAC SHA-256 signature hota hai.
