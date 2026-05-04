# Apiagex

Apiagex is planned as an installable, open-source, multi-tenant headless CMS platform.

Apiagex ek installable, open-source, multi-tenant headless CMS platform ke roop me banaya jayega.

## Project Context

Read [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) before continuing work, especially after switching models or sessions.

Kaam continue karne se pehle [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) padho, especially model ya session switch ke baad.

## First Goal

The first deliverable is the `create-apiagex` installer. A new user should be able to run one command, answer setup questions, and get a ready CMS project.

Pehla deliverable `create-apiagex` installer hai. New user ek command run kare, setup questions answer kare, aur ready CMS project paaye.

```bash
npx create-apiagex my-cms
```

## Workspace

```txt
packages/create-apiagex  Installer CLI
packages/core           CMS core contracts
packages/server         Fastify server package
packages/database       Database adapter package
packages/admin          Admin UI package
docs                    English and Hindi documentation
```

## Docs Page

Open `docs/index.html` in a browser to read the documentation page with Hindi and English toggle buttons.

Documentation page padhne ke liye browser me `docs/index.html` open karo. Top par Hindi aur English toggle buttons hain.

After starting the API server, the same docs are available at `http://localhost:4000/docs`.

API server start karne ke baad same docs `http://localhost:4000/docs` par milenge.

```bash
npm run dev
```

## Release Checks

Before shipping, run:

```bash
npm run check
npm run smoke
npm audit --audit-level=high
npm run release:check
```

Release smoke flow padhne ke liye `docs/release.md` open karo.
