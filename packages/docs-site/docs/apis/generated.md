# Generated Content API

Every saved schema exposes a generated REST API.

For schema slug `blog-post`:

| Method | Route | Permission |
| --- | --- | --- |
| GET | `/api/content/blog-post` | `getAll` |
| POST | `/api/content/blog-post` | `create` |
| GET | `/api/content/blog-post/:entryId` | `get` |
| PUT | `/api/content/blog-post/:entryId` | `update` |
| DELETE | `/api/content/blog-post/:entryId` | `delete` |

## List Query Options

```text
GET /api/content/blog-post?fields=title,status&search=summer&limit=20&offset=0
```

| Query | Use |
| --- | --- |
| `fields` | Return only selected data fields. |
| `search` | Search projected content. |
| `limit` | Page size. |
| `offset` | Page offset. |
| `populate=relations` | Expand one-level relations. |

## Create

```bash
curl -X POST http://127.0.0.1:4000/api/content/blog-post \
  -H "authorization: Bearer <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"data":{"title":"Launch post","status":"draft"}}'
```

Hinglish: Schema save karte hi uska `/api/content/{slug}` API ban jata hai. Role permission ke hisab se call allow ya block hota hai.
