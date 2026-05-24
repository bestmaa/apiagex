# Schema Builder

Schemas define the structure of your content and generate REST APIs.

Open:

```text
/adminui/#schemas
```

<div class="screen">
  <img src="/screenshots/schema/schema-builder-empty.png" alt="Apiagex schema builder screen">
</div>

## Create A Schema

1. Click `Schema Builder`.
2. Click `Create Schema` or use the schema form.
3. Enter a human name such as `Blog Post`.
4. Set a slug such as `blog-post`.
5. Add fields.
6. Save the schema.

After saving, Apiagex creates generated content routes:

```text
GET    /api/content/blog-post
POST   /api/content/blog-post
GET    /api/content/blog-post/:entryId
PUT    /api/content/blog-post/:entryId
DELETE /api/content/blog-post/:entryId
```

## Field Rules

- Field slugs become JSON keys in entry `data`.
- Required fields must be present on create.
- Unknown fields are rejected.
- Relation fields must target an existing schema.
- Option fields must include their allowed options.

Hinglish: Schema banate waqt jo field slug doge wahi API payload me key banega. Example `title` field hai to POST me `data.title` bhejna hoga.

::: tip Browser Check
This screenshot is captured from `/adminui/#schemas` with Browser in desktop mode.
:::
