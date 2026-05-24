# Example Standards

Use consistent placeholders and headers in docs.

## Tokens

Use:

```text
<TOKEN>
```

Do not use real token-looking values.

## Curl

```bash
curl http://127.0.0.1:4000/api/content/blog-post \
  -H "authorization: Bearer <TOKEN>"
```

## JSON

Use compact examples with real field names:

```json
{
  "data": {
    "title": "Example",
    "status": "draft"
  }
}
```

## Planned Features

If a feature is not implemented, write `Planned` in the heading or callout.
