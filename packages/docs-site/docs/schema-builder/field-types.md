# Field Types

Field type controls Admin UI input, API validation, database storage shape, OpenAPI output, generated TypeScript, and AI/MCP schema planning.

| Type | Admin UI Control | API Value | Database Storage |
| --- | --- | --- | --- |
| `text` | Single-line text input | string | JSON string |
| `longText` | Multi-line textarea | string | JSON string |
| `number` | Number input | number | JSON number |
| `boolean` | Checkbox/toggle | boolean | JSON boolean |
| `date` | Date input | `YYYY-MM-DD` string | JSON string |
| `email` | Email input | valid email string | JSON string |
| `url` | URL input | `http` or `https` URL string | JSON string |
| `integer` | Number input without decimals | integer number | JSON number |
| `decimal` | Decimal number input | number | JSON number |
| `currency` | Decimal money input | number | JSON number |
| `datetime` | Date-time input | ISO-like date-time string | JSON string |
| `time` | Time input | time string | JSON string |
| `password` | Hidden password input | string | JSON string |
| `richText` | Large rich text textarea | string | JSON string |
| `enum` | Select | one option string | JSON string |
| `multiSelect` | Multi-select | string array | JSON array |
| `relation` | Entry picker | entry id or entry id array | JSON string or array |
| `media` | File upload/url | URL string | JSON string |
| `file` | File upload/url | URL string | JSON string |
| `image` | Image upload/url | URL string | JSON string |

::: danger Password Fields
`password` is only a hidden string field. Apiagex does not automatically hash schema password fields. Use workflow/custom auth code for hashing and verification.
:::

## Example Entry Payload

```json
{
  "data": {
    "title": "Summer menu",
    "status": "published",
    "tags": ["seasonal", "featured"],
    "price": 299.5,
    "publishedAt": "2026-05-24T10:30",
    "coverImage": "/uploads/blog-post/cover-image/example.png"
  }
}
```
