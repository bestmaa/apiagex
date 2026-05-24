# Create a Project

Use this flow when you want a fresh frontend/backend project powered by Apiagex.

```bash
npm create apiagex@latest
cd my-project
npm install
npm run smoke
npm run build
npm run dev
```

Open:

```text
http://127.0.0.1:4000/adminui
```

## Database Choice

| Provider | Best For | Setup |
| --- | --- | --- |
| SQLite | Local development, demos, small single-user tests. | Default local file database. |
| PostgreSQL | Production and SaaS deployments. | Set `APIAGEX_DATABASE_PROVIDER=postgres` and `APIAGEX_DATABASE_URL`. |
| MySQL | Production teams already standardized on MySQL. | Set `APIAGEX_DATABASE_PROVIDER=mysql` and `APIAGEX_DATABASE_URL`. |

Hinglish: Local test ke liye SQLite easy hai. Production me PostgreSQL ya MySQL better hai. DB URL `.env` me rakho, source file me nahi.

## First Checks

```bash
npm run smoke
npm run build
npm run ai -- doctor
```

`npm run ai -- doctor` prints whether Apiagex AI context and automation token environment are configured. It never prints token values.

## Safe Token Setup

For AI/Codex project work, create a temporary automation token from Admin UI:

```text
/adminui/#settings/automation-tokens
```

Then set it in your shell:

```bash
export APIAGEX_AUTOMATION_TOKEN="<TOKEN>"
npm run ai -- doctor
```

Do not commit real tokens to `.apiagex/codex.md`, `.env.example`, docs, screenshots, or source files.
