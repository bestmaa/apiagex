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
- setup mode: `quickstart` or `custom`
- package manager: `npm`, `pnpm`, or `yarn`
- whether dependencies should be installed after scaffold
- whether git should be initialized
- whether owner bootstrap should happen during setup or later from Admin UI

For CI or scripted setup:

```bash
npx create-apiagex my-cms --yes
npx create-apiagex my-cms --setup quickstart --package-manager npm --no-install --no-git --no-owner
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
- setup mode: `quickstart` ya `custom`
- package manager: `npm`, `pnpm`, ya `yarn`
- scaffold ke baad dependencies install karni hain ya nahi
- git initialize karna hai ya nahi
- owner bootstrap setup me karna hai ya later Admin UI se

CI ya scripted setup ke liye:

```bash
npx create-apiagex my-cms --yes
npx create-apiagex my-cms --setup quickstart --package-manager npm --no-install --no-git --no-owner
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

- `npm run dev`: starts Apiagex locally through `apiagex dev`
- `npm run start`: starts Apiagex through `apiagex start`
- `npm run smoke`: checks runtime health through `apiagex smoke`
- `npm run build`: prints runtime build guidance through `apiagex build`

The generated project depends on `@apiagex/server`, which exposes the installed `apiagex` command.

### Hinglish

- `npm run dev`: `apiagex dev` ke through local Apiagex start karta hai
- `npm run start`: `apiagex start` ke through Apiagex start karta hai
- `npm run smoke`: `apiagex smoke` se runtime health check karta hai
- `npm run build`: `apiagex build` se runtime build guidance print karta hai

Generated project `@apiagex/server` par depend karta hai, jo installed `apiagex` command expose karta hai.

## Environment

### English

Generated projects include `.env.example`.

- `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite`
- `APIAGEX_UPLOADS_PATH=.apiagex/uploads`
- `PORT=4000`
- `HOST=127.0.0.1`

Copy `.env.example` to `.env` when you need custom local paths or ports.

### Hinglish

Generated projects me `.env.example` hota hai.

- `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite`
- `APIAGEX_UPLOADS_PATH=.apiagex/uploads`
- `PORT=4000`
- `HOST=127.0.0.1`

Custom local paths ya ports chahiye ho to `.env.example` ko `.env` me copy karo.

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
