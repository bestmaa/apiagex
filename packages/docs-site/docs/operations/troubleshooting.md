# Troubleshooting

## Login

| Symptom | Check |
| --- | --- |
| Owner login fails | Confirm email/password and that the owner exists. |
| Admin page says login required | Login owner again; owner token may be invalid after password change. |

## API

| Status | Meaning |
| --- | --- |
| `401` | Missing or invalid token. |
| `403` | Token role does not have permission. |
| `400` | Validation failed or payload shape is wrong. |
| `404` | Schema, entry, or route not found. |

## Database

| Error | Meaning |
| --- | --- |
| `DATABASE_URL_REQUIRED` | PostgreSQL/MySQL selected but no database URL is set. |
| `ECONNREFUSED` | Database host is not reachable. |

## Media

If image upload fails, check content type and field type. `image` accepts images only; `file` and `media` also allow PDF.

## Realtime

If WebSocket connection fails, create a fresh realtime session token and confirm realtime is enabled for the schema.
