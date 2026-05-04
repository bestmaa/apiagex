# Security

## English

`POST /auth/login` returns a bearer token and role.

Admin UI stores the token expiry time and clears the session automatically when the token expires or the API returns `401`.

- `owner` and `admin` can manage the role catalog.
- `admin` can write.
- `editor` can manage entries.
- `viewer` is read-only.

Admin routes require a bearer token.

The role catalog lives at `/admin/roles` and stores `id`, `name`, `description`, and a JSON `permissions` object. Built-in roles cannot be deleted.

## Hindi

`POST /auth/login` bearer token aur role return karta hai.

Admin UI token expiry time store karta hai aur token expire hone ya API ke `401` return karne par session auto-clear karta hai.

- `owner` aur `admin` role catalog manage kar sakte hain.
- `admin` write kar sakta hai.
- `editor` entries manage kar sakta hai.
- `viewer` read-only hai.

Admin routes ke liye bearer token required hai.

Role catalog `/admin/roles` par hai aur `id`, `name`, `description`, aur JSON `permissions` object store karta hai. Built-in roles delete nahi kiye ja sakte.
