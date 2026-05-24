# Entries

Entries are records created from a schema.

Open:

```text
/adminui/#entries
```

<div class="screen">
  <img src="/screenshots/entries/create-entry-form.png" alt="Apiagex entries screen">
</div>

## Admin UI Flow

1. Select a collection from the entry page.
2. Click `Create entry`.
3. Fill generated fields.
4. Save.
5. Use the table to inspect, edit, or delete entries.

## API Shape

```bash
curl -X POST http://127.0.0.1:4000/api/content/blog-post \
  -H "authorization: Bearer <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"data":{"title":"Hello Apiagex"}}'
```

Response entries include:

```json
{
  "id": "entry_id",
  "schemaId": "schema_id",
  "data": {
    "title": "Hello Apiagex"
  },
  "createdAt": "2026-05-24T00:00:00.000Z",
  "updatedAt": "2026-05-24T00:00:00.000Z"
}
```

::: tip Hinglish
Entry screen schema ke fields se form banata hai. Agar field required hai ya type galat hai to save ke time validation error aayega.
:::
