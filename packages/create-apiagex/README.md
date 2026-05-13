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

Interactive setup asks for setup mode, package manager, dependency install preference, git init preference, and owner bootstrap preference.

Generated starter files:

- `package.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `docs/README.md`

The generated `.env.example` documents `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite` and `APIAGEX_UPLOADS_PATH=.apiagex/uploads` for local persistence.

The generated `package.json` depends on `apiagex-server` and exposes `npm run dev`, `npm run start`, `npm run smoke`, and `npm run build`.

The generated starter README points users to `/doc`, `/readme`, and `/adminui`, includes practical owner/schema/entry/role/webhook/realtime flow, and explains common errors.

The generated `docs/README.md` explains generated API shape, access control, webhooks, realtime, relation docs, payloads, populate options, Admin UI entry pickers, and common errors.

The generated-project test verifies this scaffold without network installs by creating a temporary project, running the runtime smoke command, starting Apiagex on a temporary port/database, and checking `/api/health`, `/adminui`, `/doc`, and `/readme`.

Example:

```bash
npm create apiagex@latest my-cms
npx create-apiagex my-cms
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

Interactive setup setup mode, package manager, dependency install preference, git init preference, aur owner bootstrap preference puchta hai.

Generated starter files:

- `package.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `docs/README.md`

Generated `.env.example` local persistence ke liye `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite` aur `APIAGEX_UPLOADS_PATH=.apiagex/uploads` document karta hai.

Generated `package.json` `apiagex-server` par depend karta hai aur `npm run dev`, `npm run start`, `npm run smoke`, aur `npm run build` expose karta hai.

Generated starter README users ko `/doc`, `/readme`, aur `/adminui` par point karta hai, practical owner/schema/entry/role/webhook/realtime flow include karta hai, aur common errors explain karta hai.

Generated `docs/README.md` generated API shape, access control, webhooks, realtime, relation docs, payloads, populate options, Admin UI entry pickers, aur common errors explain karta hai.

Generated-project test network install ke bina scaffold verify karta hai: temporary project create karta hai, runtime smoke command chalata hai, temporary port/database par Apiagex start karta hai, aur `/api/health`, `/adminui`, `/doc`, plus `/readme` check karta hai.

Example:

```bash
npm create apiagex@latest my-cms
npx create-apiagex my-cms
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
