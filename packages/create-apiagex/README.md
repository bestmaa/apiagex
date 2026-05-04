# create-apiagex

## English

This package owns the first-run installer. It will generate new Apiagex projects and ask setup questions like database type, database credentials, admin account, and realtime preference.

Current output:

- `package.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `src/`
- `docs/`

The installer also asks for a target folder name and blocks accidental overwrite when that folder already has files.

Project name and target folder must be safe slugs like `my-cms`.

After install, it shows a short success screen with next commands and the docs URL.

Admin email, admin password, and database settings are validated before files are written.

The generated `.env.example` also includes `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` for the bootstrap login flow.

The generated starter also runs a smoke check before the success message prints.

SQLite starter boot files are included so local dev can start without a separate database server.

The starter also includes a small migration scaffold that creates system tables on boot.

It also includes content-type storage helpers for `content_types` and `content_fields`.

Run it with:

```bash
npm run dev -w create-apiagex
```

## Hindi

Ye package first-run installer ka owner hai. Ye new Apiagex projects generate karega aur database type, database credentials, admin account, aur realtime preference jaise setup questions puchega.

Current output:

- `package.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `src/`
- `docs/`

Installer target folder ka naam bhi poochta hai aur agar folder me pehle se files hain to accidental overwrite block karta hai.

Project name aur target folder safe slug hone chahiye, jaise `my-cms`.

Install ke baad success screen next commands aur docs URL dikhati hai.

Admin email, admin password, aur database settings files likhne se pehle validate hote hain.

Generated `.env.example` me `ADMIN_EMAIL`, `ADMIN_PASSWORD`, aur `AUTH_SECRET` bhi aate hain, taaki bootstrap login flow ready ho.

Generated starter me success message se pehle smoke check bhi hota hai.

SQLite starter boot files bhi include hote hain taaki local dev bina separate database server ke start ho sake.

Starter me ek chhota migration scaffold bhi hota hai jo boot par system tables create karta hai.

Starter me `content_types` aur `content_fields` ke liye content-type storage helpers bhi hote hain.

Run karne ke liye:

```bash
npm run dev -w create-apiagex
```
