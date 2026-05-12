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
