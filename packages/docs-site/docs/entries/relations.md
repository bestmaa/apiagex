# Relations And Populate

Relations connect entries between schemas.

## Relation Types

| Relation | Value Shape | Example |
| --- | --- | --- |
| One-to-one | one entry id string | User -> Profile |
| Many-to-one | one entry id string | Article -> Category |
| One-to-many | entry id array | Author -> Articles |
| Many-to-many | entry id array | Articles <-> Tags |

## Raw Response

```json
{
  "data": {
    "title": "Pasta",
    "category": "category_entry_id"
  }
}
```

## Populated Response

Call:

```text
GET /api/content/menu-item?populate=relations
```

Response:

```json
{
  "data": {
    "title": "Pasta",
    "category": {
      "id": "category_entry_id",
      "data": {
        "name": "Dinner"
      }
    }
  }
}
```

Populate is currently one level deep. Related entries are expanded only when the request role has permission to read the target schema.

::: tip Hinglish
Relation me raw API entry id deta hai. `populate=relations` lagane par related entry ka object milta hai.
:::
