# Media Upload Flow

Apiagex media uses one central engine with schema-scoped folders. That keeps upload validation and file serving in one place, while still making every uploaded file belong to the schema and field that used it.

Hinglish: Media ka engine central hai, lekin file path schema aur field ke hisab se scoped hai. Isse duplicate upload logic nahi banta aur control schema level par clear rehta hai.

## Recommended Flow

Create or update entries through the schema entry API:

```http
POST /api/admin/schemas/{schemaId}/entries
PUT /api/admin/schemas/{schemaId}/entries/{entryId}
```

Send normal entry data in `data`. Send files in `mediaUploads`, keyed by the `media`, `file`, or `image` field slug:

```json
{
  "data": {
    "title": "Launch post"
  },
  "mediaUploads": {
    "hero": {
      "filename": "hero.png",
      "contentType": "image/png",
      "contentBase64": "..."
    }
  }
}
```

Apiagex uploads the file and saves the returned URL into the entry data:

```json
{
  "title": "Launch post",
  "hero": "/uploads/article/hero/uuid-hero.png"
}
```

## Folder Shape

Files uploaded through a schema entry are stored under:

```text
uploads/
  {schemaSlug}/
    {fieldSlug}/
      {uuid}-{sanitizedFilename}
```

Example:

```text
uploads/article/hero/4f8...-hero.png
uploads/product/gallery/91a...-front.webp
```

## Direct Upload Fallback

`POST /api/admin/media` still exists for global/direct uploads. It returns a `/uploads/...` URL, and that URL can be saved manually into any `media`, `file`, or `image` field.

Use the schema entry API when you want Apiagex to upload the file and save the URL in one request. Use direct upload when you intentionally want to upload first and attach later.

## Permissions

Schema entry media follows the same control-plane entry API path as the schema entry being created or updated. The file is scoped under that schema/field folder, so future role rules can target schema media without changing the storage shape.

Current public content APIs still store media as URL strings. Public/API-role media upload should be added as a separate permissioned feature if non-admin clients need direct file uploads.

## Rules

- `media` and `file` uploads allow PNG, JPEG, GIF, WebP, and PDF.
- `image` uploads allow PNG, JPEG, GIF, and WebP.
- Max upload size: 10 MB per file.
- Filenames are sanitized.
- Path traversal is blocked.
- Upload field values are stored as URL strings in entry JSON.
- Project templates preserve `media`, `file`, and `image` field definitions and URL strings, but do not bundle binary files into JSON.
