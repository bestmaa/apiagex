# Install Flow

## English

The installer asks for project name, database type, credentials, admin account, and realtime preference before generating a starter project.

```bash
npx create-apiagex my-cms
```

Expected database options:

- SQLite local file
- PostgreSQL
- MySQL

Generated starter files:

- `package.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `src/`
- `docs/`

Before writing files, the installer asks for a target folder name. If that folder already has files, it asks for overwrite confirmation.

Project names must be safe lowercase slugs like `my-cms`.

After install, the CLI prints a success screen with `cd`, `npm install`, `npm run dev`, and the docs URL.

The installer validates admin email, admin password, and database settings before writing files.

The generated `.env.example` includes `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` so the bootstrap login flow can start immediately.

If you want extra accounts, you can also fill `EDITOR_EMAIL` / `EDITOR_PASSWORD` and `VIEWER_EMAIL` / `VIEWER_PASSWORD` after generation.

The generated starter runs a smoke check before the success message appears.

The generated starter includes SQLite boot files for local development.

The generated starter also includes a migration scaffold so system tables are created on startup.

It also includes content-type storage helpers for `content_types` and `content_fields`.

## Hindi

Installer project name, database type, credentials, admin account, aur realtime preference poochkar starter project generate karta hai.

```bash
npx create-apiagex my-cms
```

Expected database options:

- SQLite local file
- PostgreSQL
- MySQL

Generated starter files:

- `package.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `src/`
- `docs/`

Files likhne se pehle installer target folder name poochta hai. Agar folder me pehle se files hain to overwrite confirmation mangta hai.

Project name safe lowercase slug hona chahiye, jaise `my-cms`.

Install ke baad CLI success screen dikhata hai jisme `cd`, `npm install`, `npm run dev`, aur docs URL hota hai.

Installer admin email, admin password, aur database settings ko files likhne se pehle validate karta hai.

Generated `.env.example` me `ADMIN_EMAIL`, `ADMIN_PASSWORD`, aur `AUTH_SECRET` included hote hain, taaki bootstrap login flow turant start ho sake.

Agar extra accounts chahiye hon to generation ke baad `EDITOR_EMAIL` / `EDITOR_PASSWORD` aur `VIEWER_EMAIL` / `VIEWER_PASSWORD` bhi fill kar sakte ho.

Generated starter me success message se pehle smoke check hota hai.

Generated starter me local development ke liye SQLite boot files included hote hain.

Generated starter me ek migration scaffold bhi hota hai, taaki startup par system tables create ho jayein.

Generated starter me `content_types` aur `content_fields` ke liye content-type storage helpers bhi hote hain.
