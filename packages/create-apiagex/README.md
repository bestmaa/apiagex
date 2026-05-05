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
