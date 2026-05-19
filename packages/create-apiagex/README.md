# create-apiagex

## English

`create-apiagex` is the installer CLI for starting a new Apiagex project.

Current CLI behavior:

- Prints help with `create-apiagex --help`.
- Prints version with `create-apiagex --version`.
- Prompts for project name and setup choices in an interactive terminal.
- Supports `--yes` and setup flags for CI/non-interactive scaffolding.
- Validates that the target folder is a safe slug like `my-cms`.
- Refuses to overwrite an existing non-empty folder.
- Supports `--dry-run` to show the scaffold plan without writing files.
- Creates a small starter scaffold when the target folder is missing or empty.

Interactive setup asks for setup mode, database provider, SQLite database path or PostgreSQL/MySQL database URL, host, port, package manager, dependency install preference, git init preference, and optional first owner bootstrap credentials.
TypeScript is the default language. Use `--language js` when a JavaScript starter is preferred.

Generated starter files:

- `package.json`
- `.gitignore`
- `.env`
- `.env.example`
- `apiagex.config.json`
- `src/index.ts` by default, or `src/index.js` with `--language js`
- `src/custom-routes.ts` by default, or `src/custom-routes.js` with `--language js`
- `tsconfig.json` for TypeScript projects
- `README.md`
- `docs/README.md`

The generated `.env` stores local setup values such as `APIAGEX_DATABASE_PROVIDER`, `APIAGEX_DATABASE_PATH` for SQLite or `APIAGEX_DATABASE_URL` for PostgreSQL/MySQL, `APIAGEX_UPLOADS_PATH`, `APIAGEX_SECRET`, `HOST`, and `PORT`. If owner bootstrap is enabled, `.env` also contains `APIAGEX_OWNER_EMAIL` and `APIAGEX_OWNER_PASSWORD`; remove the password after the first successful start.

The generated `package.json` depends on `@apiagex/server` and exposes `npm run dev`, `npm run start`, `npm run smoke`, and `npm run build`. TypeScript projects also expose `npm run types`.

The generated `src/custom-routes.ts` or `src/custom-routes.js` is the place for business APIs such as checkout, pay order, assign rider, and reports. Write routes such as `/orders/:id/pay`; Apiagex mounts them under `/api/custom/orders/:id/pay`, discovers them for Admin UI, and blocks them until Settings / Custom API Permissions allows a role.

For TypeScript projects, run this after creating or changing schemas in Admin UI:

```bash
npm run types
```

It generates `src/apiagex-types.ts` so `RegisterApiagexCustomRoutes` automatically gets schema slug and field autocomplete. Custom routes can call typed helpers such as `apiagex.schemas.getBySlug("products")`, `apiagex.entries.query("products", options)`, and `apiagex.entries.create("products", { data })`.

The generated starter README points users to `/doc`, `/readme`, and `/adminui`, includes practical owner/schema/entry/role/webhook/realtime flow, and explains common errors.

The generated `docs/README.md` explains generated API shape, custom business APIs, access control, webhooks, realtime, relation docs, payloads, populate options, Admin UI entry pickers, and common errors.

The generated-project test verifies this scaffold without network installs by creating a temporary project, running the runtime smoke command, starting Apiagex on a temporary port/database, and checking `/api/health`, `/adminui`, `/doc`, and `/readme`.

Example:

```bash
npm create apiagex@latest my-cms
npx create-apiagex my-cms
npx create-apiagex my-cms --language js
npm run build -w create-apiagex
node packages/create-apiagex/dist/index.js my-cms --dry-run
node packages/create-apiagex/dist/index.js my-cms --yes
node packages/create-apiagex/dist/index.js --dry-run
```

Local workspace test before publishing:

```bash
npm run build -w create-apiagex
cd newproject
npx create-apiagex my-cms --yes
```

After scaffolding:

```bash
cd my-cms
npm install
npm run dev
```

## Hinglish

`create-apiagex` new Apiagex project start karne ke liye installer CLI hai.

Current CLI behavior:

- `create-apiagex --help` se help print hoti hai.
- `create-apiagex --version` se version print hota hai.
- Interactive terminal me project name aur setup choices puche jaate hain.
- CI/non-interactive scaffold ke liye `--yes` aur setup flags support hain.
- Target folder safe slug hona chahiye, jaise `my-cms`.
- Existing non-empty folder overwrite nahi hota.
- `--dry-run` scaffold plan dikhata hai bina files likhe.
- Target folder missing ya empty ho to small starter scaffold create hota hai.

Interactive setup setup mode, database provider, SQLite database path ya PostgreSQL/MySQL database URL, host, port, package manager, dependency install preference, git init preference, aur optional first owner bootstrap credentials puchta hai.
TypeScript default language hai. JavaScript starter chahiye ho to `--language js` use karo.

Generated starter files:

- `package.json`
- `.gitignore`
- `.env`
- `.env.example`
- `apiagex.config.json`
- default me `src/index.ts`, ya `--language js` ke saath `src/index.js`
- default me `src/custom-routes.ts`, ya `--language js` ke saath `src/custom-routes.js`
- TypeScript projects ke liye `tsconfig.json`
- `README.md`
- `docs/README.md`

Generated `.env` local setup values store karta hai, jaise `APIAGEX_DATABASE_PROVIDER`, SQLite ke liye `APIAGEX_DATABASE_PATH` ya PostgreSQL/MySQL ke liye `APIAGEX_DATABASE_URL`, `APIAGEX_UPLOADS_PATH`, `APIAGEX_SECRET`, `HOST`, aur `PORT`. Owner bootstrap enable ho to `.env` me `APIAGEX_OWNER_EMAIL` aur `APIAGEX_OWNER_PASSWORD` bhi hota hai; first successful start ke baad password hata do.

Generated `package.json` `@apiagex/server` par depend karta hai aur `npm run dev`, `npm run start`, `npm run smoke`, aur `npm run build` expose karta hai. TypeScript projects me `npm run types` bhi hota hai.

Generated `src/custom-routes.ts` ya `src/custom-routes.js` business APIs ke liye jagah hai, jaise checkout, pay order, assign rider, aur reports. Route `/orders/:id/pay` jaisa likho; Apiagex usko `/api/custom/orders/:id/pay` par mount karta hai, Admin UI me discover karta hai, aur Settings / Custom API Permissions me role allow hone tak block rakhta hai.

TypeScript projects me Admin UI se schema create/change karne ke baad ye chalao:

```bash
npm run types
```

Ye `src/apiagex-types.ts` generate karta hai jisse `RegisterApiagexCustomRoutes` me schema slug aur field autocomplete automatic milta hai. Custom routes me `apiagex.schemas.getBySlug("products")`, `apiagex.entries.query("products", options)`, aur `apiagex.entries.create("products", { data })` jaise helpers typed ho jaate hain.

Generated starter README users ko `/doc`, `/readme`, aur `/adminui` par point karta hai, practical owner/schema/entry/role/webhook/realtime flow include karta hai, aur common errors explain karta hai.

Generated `docs/README.md` generated API shape, access control, webhooks, realtime, relation docs, payloads, populate options, Admin UI entry pickers, aur common errors explain karta hai.

Generated-project test network install ke bina scaffold verify karta hai: temporary project create karta hai, runtime smoke command chalata hai, temporary port/database par Apiagex start karta hai, aur `/api/health`, `/adminui`, `/doc`, plus `/readme` check karta hai.

Example:

```bash
npm create apiagex@latest my-cms
npx create-apiagex my-cms
npx create-apiagex my-cms --language js
npm run build -w create-apiagex
node packages/create-apiagex/dist/index.js my-cms --dry-run
node packages/create-apiagex/dist/index.js my-cms --yes
node packages/create-apiagex/dist/index.js --dry-run
```

Publish se pehle local workspace test:

```bash
npm run build -w create-apiagex
cd newproject
npx create-apiagex my-cms --yes
```

Scaffold ke baad:

```bash
cd my-cms
npm install
npm run dev
```
