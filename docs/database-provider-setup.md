# Database Provider Setup

Apiagex supports SQLite, PostgreSQL, and MySQL at runtime. SQLite is still the default local choice because it needs no external server. PostgreSQL and MySQL need a reachable database URL.

Apiagex runtime me SQLite, PostgreSQL, aur MySQL support hain. Local start ke liye SQLite default hai kyunki external server nahi chahiye. PostgreSQL/MySQL ke liye reachable database URL chahiye.

## Create Project

```bash
npm create apiagex@latest my-cms
cd my-cms
npm install
npm run dev
```

Interactive setup asks for the database provider. If you choose SQLite, it asks for `APIAGEX_DATABASE_PATH`. If you choose PostgreSQL or MySQL, it asks for `APIAGEX_DATABASE_URL`.

Interactive setup database provider puchta hai. SQLite choose karoge to `APIAGEX_DATABASE_PATH` puchta hai. PostgreSQL ya MySQL choose karoge to `APIAGEX_DATABASE_URL` puchta hai.

## SQLite

Use SQLite for local development and small deployments.

```env
APIAGEX_DATABASE_PROVIDER=sqlite
APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite
APIAGEX_UPLOADS_PATH=.apiagex/uploads
APIAGEX_SECRET=change-me
HOST=127.0.0.1
PORT=4000
```

The runtime creates the SQLite parent folder automatically. Data is stored in the file from `APIAGEX_DATABASE_PATH`.

Runtime SQLite parent folder automatically create karta hai. Data `APIAGEX_DATABASE_PATH` wale file me store hota hai.

## PostgreSQL

Use PostgreSQL when you want a server database.

```env
APIAGEX_DATABASE_PROVIDER=postgres
APIAGEX_DATABASE_URL=postgres://apiagex:secret@localhost:5432/apiagex
APIAGEX_UPLOADS_PATH=.apiagex/uploads
APIAGEX_SECRET=change-me
HOST=127.0.0.1
PORT=4000
```

The database must already exist and the URL user must be allowed to create tables, insert rows, update rows, and delete rows. Apiagex runs its foundation migration on start.

Database pehle se exist hona chahiye aur URL user ke paas table create, insert, update, delete permissions hone chahiye. Apiagex start par foundation migration chalata hai.

## MySQL

Use MySQL when your hosting or team standard requires it.

```env
APIAGEX_DATABASE_PROVIDER=mysql
APIAGEX_DATABASE_URL=mysql://apiagex:secret@localhost:3306/apiagex
APIAGEX_UPLOADS_PATH=.apiagex/uploads
APIAGEX_SECRET=change-me
HOST=127.0.0.1
PORT=4000
```

The database must already exist and use a charset/collation that supports your content. Apiagex creates the required tables with InnoDB foreign keys.

Database pehle se exist hona chahiye aur charset/collation aapke content ko support karna chahiye. Apiagex required tables InnoDB foreign keys ke saath create karta hai.

## First Owner

You can create the first owner from `/adminui`, or set these values before the first start:

```env
APIAGEX_OWNER_EMAIL=owner@example.com
APIAGEX_OWNER_PASSWORD=OwnerPass123!
```

Remove `APIAGEX_OWNER_PASSWORD` after the first successful start.

Pehla owner `/adminui` se create kar sakte ho, ya first start se pehle owner env values set kar sakte ho. First successful start ke baad `APIAGEX_OWNER_PASSWORD` hata do.

## Common Errors

- `DATABASE_PROVIDER_NOT_SUPPORTED`: `APIAGEX_DATABASE_PROVIDER` must be `sqlite`, `postgres`, or `mysql`.
- `DATABASE_URL_REQUIRED: postgres`: PostgreSQL selected hai, lekin `APIAGEX_DATABASE_URL` missing hai.
- `DATABASE_URL_REQUIRED: mysql`: MySQL selected hai, lekin `APIAGEX_DATABASE_URL` missing hai.
- `ECONNREFUSED`: database server reachable nahi hai, host/port wrong hai, ya database container start nahi hua.
- `Access denied` / authentication failed: username/password wrong hai ya user ko database permission nahi mila.
- `Unknown database`: database create nahi hua. Pehle database create karo, phir Apiagex start karo.

## Verification

Local SQLite verification:

```bash
npm run smoke
npm run check
```

Fresh generated project verification:

```bash
mkdir -p project-test
cd project-test
node ../packages/create-apiagex/dist/index.js my-cms --yes
cd my-cms
npm run smoke
```

Optional PostgreSQL integration test:

```bash
APIAGEX_TEST_POSTGRES_URL=postgres://apiagex:secret@localhost:5432/apiagex npm run test -w @apiagex/database
```

Optional MySQL integration test:

```bash
APIAGEX_TEST_MYSQL_URL=mysql://apiagex:secret@localhost:3306/apiagex npm run test -w @apiagex/database
```

If the optional URL is not set, the real database integration test is skipped, but adapter unit tests and config tests still run.

Optional URL set nahi hai to real database integration test skip hota hai, lekin adapter unit tests aur config tests phir bhi run hote hain.
