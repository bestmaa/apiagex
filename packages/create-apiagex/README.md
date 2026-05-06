# create-apiagex

## English

`create-apiagex` is the installer CLI for starting a new Apiagex project.

Current CLI behavior:

- Prints help with `create-apiagex --help`.
- Prints version with `create-apiagex --version`.
- Validates that the target folder is a safe slug like `my-cms`.
- Refuses to overwrite an existing non-empty folder.
- Supports `--dry-run` to show the scaffold plan without writing files.
- Creates a small starter scaffold when the target folder is missing or empty.

Generated starter files:

- `package.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `src/main.ts`
- `docs/README.md`

The generated `.env.example` documents `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite` and `APIAGEX_UPLOADS_PATH=.apiagex/uploads` for local persistence.

The generated starter README points users to `/doc`, `/readme`, and `/adminui`, and includes relation examples for one-to-one, one-to-many, many-to-one, and many-to-many modeling.

The generated `docs/README.md` points relation docs to `/doc`, including payloads, populate options, Admin UI entry pickers, and common errors.

Example:

```bash
npm run build -w create-apiagex
node packages/create-apiagex/dist/index.js my-cms --dry-run
node packages/create-apiagex/dist/index.js my-cms
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
- Target folder safe slug hona chahiye, jaise `my-cms`.
- Existing non-empty folder overwrite nahi hota.
- `--dry-run` scaffold plan dikhata hai bina files likhe.
- Target folder missing ya empty ho to small starter scaffold create hota hai.

Generated starter files:

- `package.json`
- `.gitignore`
- `.env.example`
- `apiagex.config.json`
- `README.md`
- `src/main.ts`
- `docs/README.md`

Generated `.env.example` local persistence ke liye `APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite` aur `APIAGEX_UPLOADS_PATH=.apiagex/uploads` document karta hai.

Generated starter README users ko `/doc`, `/readme`, aur `/adminui` par point karta hai, aur one-to-one, one-to-many, many-to-one, aur many-to-many relation examples include karta hai.

Generated `docs/README.md` relation docs ke liye `/doc` batata hai, including payloads, populate options, Admin UI entry pickers, aur common errors.

Example:

```bash
npm run build -w create-apiagex
node packages/create-apiagex/dist/index.js my-cms --dry-run
node packages/create-apiagex/dist/index.js my-cms
```

Scaffold ke baad:

```bash
cd my-cms
npm install
npm run dev
```
