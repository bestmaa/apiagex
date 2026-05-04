# Public API

## English

Public read routes are available at `/api/:slug` and `/api/:slug/:entryId`.

Without `populate`, relation and media fields stay as raw ids.

With `populate`, the API can resolve:

- `relations`
- `media`
- `all` or `*`

Example:

```txt
/api/articles?populate=relations,media
```

Population is one level deep. Related entries are returned as public entries, and media ids are returned as public file records with a URL under `/uploads/`.

Draft previews are available through signed preview tokens issued by the admin API. Use the admin preview button on an entry to get a tokenized preview URL, and the public route will return the draft entry for that URL even when the entry is not published.

Scheduled entries stay hidden from the public API until the background publish sweep marks them as `published`.

## Hindi

Public read routes `/api/:slug` aur `/api/:slug/:entryId` par available hain.

`populate` ke bina relation aur media fields raw ids hi rehti hain.

`populate` ke saath API ye resolve kar sakti hai:

- `relations`
- `media`
- `all` ya `*`

Example:

```txt
/api/articles?populate=relations,media
```

Population one level deep hota hai. Related entries public entries ke form me aati hain, aur media ids public file records ke form me `/uploads/` URL ke saath aati hain.

Draft previews signed preview tokens ke through available hain. Kisi entry par admin preview button use karo to tokenized preview URL milegi, aur public route us URL par draft entry return karega even if entry published nahi hai.

Scheduled entries public API me hidden rehti hain jab tak background publish sweep unhe `published` na bana de.
