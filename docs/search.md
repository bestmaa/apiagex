# Global Search

## English

The admin shell exposes a global search panel.

It searches across:

- Content types
- Entries
- Media files

The search endpoint is `GET /admin/search?q=...` and the admin UI proxies it through `/api/search`.

Result types:

- Content type results open the content type builder.
- Entry results open the entry editor for that content type.
- Media results link to the uploaded file.

## Hindi

Admin shell me global search panel available hai.

Ye in cheezon me search karta hai:

- Content types
- Entries
- Media files

Search endpoint `GET /admin/search?q=...` hai aur admin UI ise `/api/search` ke through proxy karti hai.

Result types:

- Content type result content type builder open karta hai.
- Entry result us content type ka entry editor open karta hai.
- Media result uploaded file ko link karta hai.
