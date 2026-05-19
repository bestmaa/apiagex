# Apiagex Install And Publish Flow

This document explains the Strapi-style installation path for new Apiagex projects and the maintainer checks before publishing packages.

Ye document new Apiagex projects ke liye Strapi-style installation path aur package publish se pehle maintainer checks explain karta hai.

## User Install Flow

### English

Use one of these commands:

```bash
npm create apiagex@latest my-cms
npx create-apiagex my-cms
```

The installer asks for:

- project name
- language: `ts` or `js` (`ts` is the default)
- setup mode: `quickstart` or `custom`
- database provider: `sqlite`, `postgres`, or `mysql`
- SQLite database path or PostgreSQL/MySQL database URL
- server host and port
- package manager: `npm`, `pnpm`, or `yarn`
- whether dependencies should be installed after scaffold
- whether git should be initialized
- whether the first owner should be bootstrapped from `.env` on first server start

For CI or scripted setup:

```bash
npx create-apiagex my-cms --yes
npx create-apiagex my-cms --language js
npx create-apiagex my-cms --setup quickstart --package-manager npm --no-install --no-git --no-owner
npx create-apiagex my-cms --setup custom --database sqlite --database-path data/apiagex.sqlite --host 0.0.0.0 --port 4000
```

After scaffold:

```bash
cd my-cms
npm install
npm run dev
```

Open:

- `http://127.0.0.1:4000/adminui` for first owner setup and admin work
- `/doc` for product/API docs
- `/readme` for project summary
- `/api/health` for runtime health

### Hinglish

In commands me se koi use karo:

```bash
npm create apiagex@latest my-cms
npx create-apiagex my-cms
```

Installer ye puchega:

- project name
- language: `ts` ya `js` (`ts` default hai)
- setup mode: `quickstart` ya `custom`
- database provider: `sqlite`, `postgres`, ya `mysql`
- SQLite database path ya PostgreSQL/MySQL database URL
- server host aur port
- package manager: `npm`, `pnpm`, ya `yarn`
- scaffold ke baad dependencies install karni hain ya nahi
- git initialize karna hai ya nahi
- first owner `.env` se first server start par bootstrap karna hai ya Admin UI se

CI ya scripted setup ke liye:

```bash
npx create-apiagex my-cms --yes
npx create-apiagex my-cms --language js
npx create-apiagex my-cms --setup quickstart --package-manager npm --no-install --no-git --no-owner
npx create-apiagex my-cms --setup custom --database sqlite --database-path data/apiagex.sqlite --host 0.0.0.0 --port 4000
```

Scaffold ke baad:

```bash
cd my-cms
npm install
npm run dev
```

Open karo:

- `http://127.0.0.1:4000/adminui` first owner setup aur admin work ke liye
- `/doc` product/API docs ke liye
- `/readme` project summary ke liye
- `/api/health` runtime health ke liye

## Generated Project Scripts

### English

- `npm run dev`: starts `src/index.ts` through `tsx` in TypeScript projects, or `src/index.js` in JavaScript projects.
- `npm run start`: starts compiled `dist/index.js` in TypeScript projects, or `src/index.js` in JavaScript projects.
- `npm run types`: TypeScript projects only; generates `src/apiagex-types.ts` from current Admin UI schemas.
- `npm run smoke`: checks runtime health through `apiagex smoke`
- `npm run build`: compiles TypeScript projects with `tsc`; JavaScript projects print runtime build guidance through `apiagex build`.

The generated project depends on `@apiagex/server`, which exposes both the `apiagex` command and the `startApiagex()` API for the generated entry file. Add business APIs in `src/custom-routes.ts` or `src/custom-routes.js` when generated CRUD cannot model the endpoint, such as checkout, pay order, assignment, and reporting routes. Write custom paths like `/orders/:id/pay`; Apiagex mounts them under `/api/custom/orders/:id/pay`, discovers them for Settings / Custom API Permissions, and blocks them until a role is allowed.

When schemas are created or changed from Admin UI, run:

```bash
npm run types
```

This writes `src/apiagex-types.ts` with:

- `apiagexSchemaSlugs`
- `ApiagexSchemaSlug`
- one data type per schema, for example `ProductsData`
- automatic schema slug and field autocomplete inside `RegisterApiagexCustomRoutes`
- typed slug helpers such as `apiagex.schemas.getBySlug("products")`, `apiagex.entries.query("products", options)`, and `apiagex.entries.create("products", { data })`

### Hinglish

- `npm run dev`: TypeScript project me `tsx` ke through `src/index.ts` start karta hai, JavaScript project me `src/index.js` start karta hai.
- `npm run start`: TypeScript project me compiled `dist/index.js` start karta hai, JavaScript project me `src/index.js` start karta hai.
- `npm run types`: sirf TypeScript projects ke liye; current Admin UI schemas se `src/apiagex-types.ts` generate karta hai.
- `npm run smoke`: `apiagex smoke` se runtime health check karta hai
- `npm run build`: TypeScript projects ko `tsc` se compile karta hai; JavaScript projects me `apiagex build` se runtime build guidance print hoti hai.

Generated project `@apiagex/server` par depend karta hai, jo installed `apiagex` command aur generated entry file ke liye `startApiagex()` API expose karta hai. Generated CRUD endpoint ko model nahi kar sakta to `src/custom-routes.ts` ya `src/custom-routes.js` me business APIs add karo, jaise checkout, pay order, assignment, aur reporting routes. Custom path `/orders/:id/pay` jaisa likho; Apiagex usko `/api/custom/orders/:id/pay` par mount karta hai, Settings / Custom API Permissions me dikhata hai, aur role allow hone tak block rakhta hai.

Admin UI se schema create ya change karne ke baad chalao:

```bash
npm run types
```

Ye `src/apiagex-types.ts` likhta hai jisse `RegisterApiagexCustomRoutes` ke andar schema slug aur field autocomplete automatic milta hai. Iske baad `apiagex.schemas.getBySlug("products")`, `apiagex.entries.query("products", options)`, aur `apiagex.entries.create("products", { data })` jaise helpers typed ho jaate hain.

## Environment

### English

Generated projects include `.env`, `.env.example`, TypeScript files `src/index.ts` and `src/custom-routes.ts` by default, or JavaScript files when `--language js` is used.

- `APIAGEX_DATABASE_PROVIDER=sqlite`
- `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite`
- `APIAGEX_UPLOADS_PATH=.apiagex/uploads`
- `APIAGEX_SECRET=<generated>`
- `PORT=4000`
- `HOST=127.0.0.1`
- `APIAGEX_OWNER_EMAIL` and `APIAGEX_OWNER_PASSWORD` are optional first-owner bootstrap values.

SQLite, PostgreSQL, and MySQL are supported provider choices. Remove `APIAGEX_OWNER_PASSWORD` from `.env` after the first owner is created.

### Hinglish

Generated projects me default TypeScript files `src/index.ts` aur `src/custom-routes.ts` hote hain; `--language js` use karne par JavaScript files milte hain.

- `APIAGEX_DATABASE_PROVIDER=sqlite`
- `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite`
- `APIAGEX_UPLOADS_PATH=.apiagex/uploads`
- `APIAGEX_SECRET=<generated>`
- `PORT=4000`
- `HOST=127.0.0.1`
- `APIAGEX_OWNER_EMAIL` aur `APIAGEX_OWNER_PASSWORD` optional first-owner bootstrap values hain.

SQLite, PostgreSQL, aur MySQL supported provider choices hain. First owner create hone ke baad `.env` se `APIAGEX_OWNER_PASSWORD` hata do.

## Maintainer Publish Checks

### English

Before publishing `@apiagex/server` and `create-apiagex`, run:

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
npm test -w create-apiagex
npm run build -w @apiagex/server
```

Also verify that `packages/create-apiagex/tests/generated-project.test.ts` passes. That test creates a temporary starter, runs runtime smoke, starts Apiagex on a temporary database/port, and checks `/api/health`, `/adminui`, `/doc`, and `/readme`.

Publish order:

```bash
npm publish -w @apiagex/database --access public
npm publish -w @apiagex/server --access public
npm publish -w create-apiagex --access public
```

`@apiagex/server` copies the built Admin UI and static docs into its `dist` folder before packing, so generated projects can serve `/adminui`, `/doc`, and `/readme` from only the installed runtime package.

Publishing requires an npm login:

```bash
npm login
npm whoami
```

The official runtime packages publish under the `@apiagex` npm organization. Keep old unscoped packages only as compatibility history. The public package order is `@apiagex/database`, `@apiagex/server`, then `create-apiagex`.

GitHub publish flow:

1. Add a GitHub repository secret named `NPM_TOKEN`.
2. Push the release commit to GitHub.
3. Open Actions > Publish npm packages.
4. Run the workflow with `dry_run=true` first.
5. Run the workflow with `dry_run=false` to publish.

The workflow checks duplicate package versions before real publish. If a package version already exists on npm, bump all package versions first.

### Hinglish

`@apiagex/server` aur `create-apiagex` publish karne se pehle ye run karo:

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
npm test -w create-apiagex
npm run build -w @apiagex/server
```

Ye bhi verify karo ki `packages/create-apiagex/tests/generated-project.test.ts` pass ho. Ye test temporary starter create karta hai, runtime smoke chalata hai, temporary database/port par Apiagex start karta hai, aur `/api/health`, `/adminui`, `/doc`, plus `/readme` check karta hai.

Publish order:

```bash
npm publish -w @apiagex/database --access public
npm publish -w @apiagex/server --access public
npm publish -w create-apiagex --access public
```

`@apiagex/server` packing se pehle built Admin UI aur static docs ko apne `dist` folder me copy karta hai, isliye generated projects sirf installed runtime package se `/adminui`, `/doc`, aur `/readme` serve kar sakte hain.

Publish karne ke liye npm login required hai:

```bash
npm login
npm whoami
```

Official runtime packages `@apiagex` npm organization ke under publish hote hain. Old unscoped packages ko sirf compatibility history ke liye rehne do. Public package order `@apiagex/database`, `@apiagex/server`, phir `create-apiagex` hai.

GitHub publish flow:

1. GitHub repository secret me `NPM_TOKEN` add karo.
2. Release commit ko GitHub par push karo.
3. Actions > Publish npm packages open karo.
4. Pehle `dry_run=true` ke saath workflow run karo.
5. Publish ke liye `dry_run=false` ke saath workflow run karo.

Workflow real publish se pehle duplicate package versions check karta hai. Agar package version npm par already hai, pehle sab package versions bump karo.
