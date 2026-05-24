# Media, File, And Image Fields

Apiagex stores uploaded binaries on disk and stores the URL/path string in entry data.

## Storage Model

```text
/uploads/{schemaSlug}/{fieldSlug}/...
```

Example:

```text
/uploads/product/photo/hero.png
```

The database entry stores:

```json
{
  "data": {
    "photo": "/uploads/product/photo/hero.png"
  }
}
```

<div class="screen">
  <img src="/screenshots/entries/media-field.png" alt="Apiagex media-capable entry form">
</div>

## Field Differences

| Type | Allows |
| --- | --- |
| `media` | Common image formats and PDF. |
| `file` | Common image formats and PDF. |
| `image` | Image formats only: PNG, JPEG, GIF, WebP. |

Hinglish: Pehle file upload hoti hai, fir jo URL milta hai wahi entry ke data me save hota hai. Binary database me nahi jaati.

## API Upload Shape

Entry APIs can accept media upload metadata through `mediaUploads` for media-capable fields.

```json
{
  "data": {
    "title": "Menu item"
  },
  "mediaUploads": {
    "photo": {
      "filename": "item.png",
      "contentType": "image/png",
      "base64": "<BASE64>"
    }
  }
}
```

::: tip Browser Check
Keep this screenshot updated with a demo schema that has `media`, `file`, or `image` fields before release.
:::
