import type { ScaffoldAnswers, ScaffoldFile } from "./create-apiagex.type.js";

export function createScaffoldFiles(answers: ScaffoldAnswers): ScaffoldFile[] {
  const isTypeScript = answers.language === "ts";
  const sourceExtension = isTypeScript ? "ts" : "js";
  const files: ScaffoldFile[] = [
    {
      path: "package.json",
      content: packageJsonFile(answers),
    },
    {
      path: "README.md",
      content: starterReadme(answers),
    },
    {
      path: ".gitignore",
      content: "node_modules\n.env\ndist\n.apiagex/*\n!.apiagex/\n!.apiagex/codex.md\n",
    },
    {
      path: ".env",
      content: envFile(answers, true),
    },
    {
      path: ".env.example",
      content: envFile(answers, false),
    },
    {
      path: "apiagex.config.json",
      content: `${JSON.stringify(
        {
          database: databaseConfig(answers),
          project: {
            appSecretEnv: "APIAGEX_SECRET",
            language: answers.language,
            packageManager: answers.packageManager,
            setupMode: answers.setupMode,
          },
          server: { host: answers.host, port: Number(answers.port) },
        },
        null,
        2,
      )}\n`,
    },
    {
      path: ".apiagex/codex.md",
      content: codexContextFile(answers),
    },
    {
      path: `src/index.${sourceExtension}`,
      content: isTypeScript ? serverEntryFileTs() : serverEntryFileJs(),
    },
    {
      path: `src/custom-routes.${sourceExtension}`,
      content: isTypeScript ? customRoutesFileTs() : customRoutesFileJs(),
    },
    {
      path: "docs/README.md",
      content: docsReadme(),
    },
  ];
  if (isTypeScript) {
    files.splice(7, 0, {
      path: "tsconfig.json",
      content: tsconfigFile(),
    });
  }
  return files;
}

export function renderPlan(projectName: string, targetDir: string, files: ScaffoldFile[], answers: ScaffoldAnswers, dryRun: boolean): string {
  const mode = dryRun ? "Dry run only. No files were written." : "Scaffolding project files.";
  const fileList = files.map((file) => `- ${file.path}`).join("\n");
  return [
    `create-apiagex will create ${projectName} at ${targetDir}.`,
    mode,
    "",
    "Selected setup:",
    `- Setup mode: ${answers.setupMode}`,
    `- Database: ${answers.databaseProvider}`,
    databasePlanLine(answers),
    `- Server: http://${answers.host}:${answers.port}`,
    `- Language: ${languageLabel(answers.language)}`,
    `- Package manager: ${answers.packageManager}`,
    `- Install dependencies: ${answers.installDependencies ? "yes" : "no"}`,
    `- Initialize git: ${answers.initGit ? "yes" : "no"}`,
    `- Owner setup: ${answers.bootstrapOwner ? "create from .env on first start" : "create from Admin UI"}`,
    "",
    "Files:",
    fileList,
    "",
    "Next commands:",
    `cd ${projectName}`,
    installCommand(answers.packageManager),
    runCommand(answers.packageManager, "dev"),
    "",
  ].join("\n");
}

function starterReadme(answers: ScaffoldAnswers): string {
  return `# ${answers.target}

Generated Apiagex starter.

## What this project gives you

English: Apiagex runs one server with /api, /adminui, /doc, and /readme. Use the Admin UI to create schemas, entries, API roles, users, webhooks, and realtime settings.

Hinglish: Apiagex ek server chalata hai jisme /api, /adminui, /doc, aur /readme hote hain. Schemas, entries, API roles, users, webhooks, aur realtime settings ke liye Admin UI use karo.

## Next commands

\`\`\`bash
${installCommand(answers.packageManager)}
${runCommand(answers.packageManager, "dev")}
\`\`\`

Open http://127.0.0.1:4000/adminui to create the first owner. Open /doc for API docs and /readme for the readable project summary.
If .env contains APIAGEX_OWNER_EMAIL and APIAGEX_OWNER_PASSWORD, the first owner is created automatically on first server start. Remove APIAGEX_OWNER_PASSWORD from .env after the first successful start.
AI assistants should read .apiagex/codex.md before creating schemas, workflows, permissions, or frontend API clients.

## Scripts

- \`${runCommand(answers.packageManager, "dev")}\`: start ${entrySourcePath(answers)} with .env.
- \`${runCommand(answers.packageManager, "start")}\`: start ${answers.language === "ts" ? "dist/index.js" : "src/index.js"} with .env.
${answers.language === "ts" ? `- \`${runCommand(answers.packageManager, "types")}\`: generate src/apiagex-types.ts from Admin UI schemas.\n` : ""}
- \`${runCommand(answers.packageManager, "ai context")}\`: refresh .apiagex/codex.md for Codex or another AI assistant.
- \`${runCommand(answers.packageManager, "ai doctor")}\`: check local AI setup without printing token values.
- \`${runCommand(answers.packageManager, "ai token")}\`: create a temporary automation token when APIAGEX_ADMIN_TOKEN is set.
- \`${runCommand(answers.packageManager, "smoke")}\`: verify the runtime health route.
- \`${runCommand(answers.packageManager, "build")}\`: ${answers.language === "ts" ? "compile TypeScript to dist." : "print runtime build guidance."}

## Environment

The installer creates .env for local use. Copy .env.example to .env again if you need to reset local settings.

- APIAGEX_DATABASE_PROVIDER: sqlite, postgres, or mysql.
${answers.databaseProvider === "sqlite"
    ? "- APIAGEX_DATABASE_PATH: SQLite database path. Default .apiagex/apiagex.sqlite."
    : "- APIAGEX_DATABASE_URL: database connection URL for PostgreSQL or MySQL."}
- APIAGEX_UPLOADS_PATH: upload folder. Default .apiagex/uploads.
- APIAGEX_SECRET: app secret generated during setup.
- PORT: server port. Default 4000.
- HOST: server host. Default 127.0.0.1.
- APIAGEX_OWNER_EMAIL and APIAGEX_OWNER_PASSWORD: optional first owner bootstrap values. Remove the password after first start.

## Practical flow

English:

1. Start the server. If owner env values exist, Apiagex creates the first owner automatically; otherwise create it from /adminui.
2. Create a schema, for example Article with a required title field.
3. Create entries from Entries or call POST /api/content/article.
4. Create Content Roles, save permissions, then create users or API tokens.
5. Use Webhooks for external server notifications and Realtime API for live browser screens.
6. Add business APIs in ${customRoutesSourcePath(answers)} when generated CRUD is not enough.
7. Run ${answers.language === "ts" ? `\`${runCommand(answers.packageManager, "types")}\`` : "`apiagex types`"} after schema changes to refresh slug and field autocomplete.

Hinglish:

1. Server start karo. Owner env values hain to Apiagex first owner automatic create karega; nahi hain to /adminui se create karo.
2. Schema banao, jaise required title field ke saath Article.
3. Entries screen se entry banao ya POST /api/content/article call karo.
4. Content Roles banao, permissions save karo, phir users ya API tokens create karo.
5. External server notifications ke liye Webhooks aur live browser screens ke liye Realtime API use karo.
6. Generated CRUD enough nahi ho to ${customRoutesSourcePath(answers)} me business APIs add karo.
7. Schema change ke baad ${answers.language === "ts" ? `\`${runCommand(answers.packageManager, "types")}\`` : "`apiagex types`"} chalao, taaki slug aur field autocomplete refresh ho.

## Common errors

- OWNER_ALREADY_BOOTSTRAPPED: owner already exists; use the same form to login.
- API_PERMISSION_DENIED: content API role is missing the required permission.
- API_TOKEN_INVALID: token is wrong or revoked.
- REALTIME_SESSION_INVALID: realtime session token was reused or expired.

## Relation Modeling

English: Create the target schema first, then add relation fields to the source schema in /adminui. Use one-to-one for Profile to User, many-to-one for Article to Category, one-to-many for Author to Articles, and many-to-many for Articles to Tags.

Hinglish: Pehle target schema banao, phir /adminui me source schema par relation fields add karo. Profile to User ke liye one-to-one, Article to Category ke liye many-to-one, Author to Articles ke liye one-to-many, aur Articles to Tags ke liye many-to-many use karo.
`;
}

function docsReadme(): string {
  return `# Apiagex Project Docs

Use /doc for generated API docs and /readme for the project summary.

## Owner and Admin UI

English: Open /adminui, create the first owner, then use the same page for later logins.

Hinglish: /adminui open karo, first owner create karo ya .env owner bootstrap use karo, phir later login ke liye same page use karo.

## Generated APIs

English: Every schema creates /api/content/:schemaSlug. Send entry data as { "data": { ... } }.

Hinglish: Har schema /api/content/:schemaSlug create karta hai. Entry data { "data": { ... } } shape me bhejo.

## Access control

English: Content API roles are separate from Admin UI roles. Give getAll, get, create, update, delete, realtime, or manage per schema.

Hinglish: Content API roles Admin UI roles se alag hain. Har schema ke liye getAll, get, create, update, delete, realtime, ya manage do.

## Webhooks and Realtime

English: Webhooks call external URLs after content changes. Realtime API sends WebSocket events only for enabled collections.

Hinglish: Webhooks content change ke baad external URLs call karte hain. Realtime API sirf enabled collections ke liye WebSocket events bhejta hai.

Relation docs: /doc explains relation field types, entry payloads, populate query options, Admin UI entry pickers, and common errors.

## Custom business APIs

English: Use src/custom-routes.ts or src/custom-routes.js for endpoints such as checkout, pay order, assign rider, or reports. Write routes like /orders/:id/pay; Apiagex mounts them under /api/custom/orders/:id/pay, discovers them, and blocks them until Settings / Custom API Permissions allows a role.

Hinglish: Checkout, pay order, assign rider, ya reports jaise endpoints ke liye src/custom-routes.ts ya src/custom-routes.js use karo. Route /orders/:id/pay jaisa likho; Apiagex usko /api/custom/orders/:id/pay par mount karta hai, Admin UI me discover karta hai, aur Settings / Custom API Permissions me role allow hone tak block rakhta hai.

Practical flow:

1. Add app.post("/orders/:entryId/pay", handler) in src/custom-routes.ts or src/custom-routes.js.
2. Restart the server. It appears as POST /api/custom/orders/:entryId/pay.
3. Open /adminui#settings/custom-api-permissions, select a content API role, search orders, allow it, and save.
4. Open Settings / API Tokens, create a token for that role, then call:

\`\`\`bash
curl -X POST http://127.0.0.1:4000/api/custom/orders/ENTRY_ID/pay \\
  -H "Authorization: Bearer API_TOKEN"
\`\`\`

The Custom API Permissions screen can also rename route labels/groups, show allow/block history, and delete old inactive routes after they are removed from code.

## Workflow APIs

English: Workflows created in Admin UI are also custom APIs. Create an active workflow in /adminui#settings/workflows, then open /adminui#settings/custom-api-permissions and allow the workflow route for public or for a content API role.

Hinglish: Admin UI me banaye gaye workflows bhi custom APIs hote hain. /adminui#settings/workflows me active workflow banao, phir /adminui#settings/custom-api-permissions me workflow route ko public ya content API role ke liye allow karo.

Public workflow call:

\`\`\`bash
curl -X POST http://127.0.0.1:4000/api/custom/orders/status \\
  -H "content-type: application/json" \\
  -d '{"orderId":"ord_123","status":"ready"}'
\`\`\`

Token-protected workflow call:

\`\`\`bash
curl -X POST http://127.0.0.1:4000/api/custom/orders/status \\
  -H "Authorization: Bearer API_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{"orderId":"ord_123","status":"ready"}'
\`\`\`

Blocked workflow calls return CUSTOM_API_PERMISSION_DENIED. Wrong or revoked tokens return API_TOKEN_INVALID. Inactive workflows are not mounted.

Register template: Settings > Workflows can create an inactive POST /api/custom/auth/register starter. Create a users content schema with email, passwordHash, and status fields first. The template validates password but does not store it; replace PASSWORD_HASH_PLACEHOLDER_REPLACE_WITH_SERVER_SIDE_HASHING with real server-side hashing before production.

Practical workflow builder flow:

1. Create a content schema and sample entries in /adminui.
2. Open /adminui#settings/workflows and create a route such as POST /products/lookup.
3. Add Query entries and Return response steps, then run the test panel.
4. Activate the workflow.
5. Open /adminui#settings/custom-api-permissions, allow public or a content API role, and save.
6. For role-protected calls, create a token in /adminui#settings/api-tokens.
7. Call /api/custom/products/lookup with curl or your app.

## Type generation

English: In TypeScript projects, run npm run types after creating or changing schemas. It writes src/apiagex-types.ts so RegisterApiagexCustomRoutes automatically gets schema slug and field autocomplete.

Hinglish: TypeScript project me schema create ya change karne ke baad npm run types chalao. Ye src/apiagex-types.ts banata hai jisse RegisterApiagexCustomRoutes me schema slug aur field autocomplete automatic milta hai.
`;
}

function codexContextFile(answers: ScaffoldAnswers): string {
  const baseUrl = `http://${answers.host}:${answers.port}`;
  return `# Apiagex Codex Context

This project uses Apiagex as the backend.

## Connection

- Base URL: ${baseUrl}
- Base URL env: APIAGEX_BASE_URL
- Automation token env: APIAGEX_AUTOMATION_TOKEN
- Admin token env, only when creating a temporary automation token: APIAGEX_ADMIN_TOKEN

Do not commit real tokens. Keep APIAGEX_AUTOMATION_TOKEN and APIAGEX_ADMIN_TOKEN in your local shell, CI secret store, or ignored .env files only.

## Safe Workflow

1. Read this file and inspect the frontend request.
2. Call \`GET $APIAGEX_BASE_URL/api/health\`.
3. Use APIAGEX_AUTOMATION_TOKEN for Apiagex setup work.
4. Inspect existing schemas, workflows, and routes before creating new ones.
5. Prefer additive changes: create missing schemas, workflow APIs, and permissions.
6. Preview risky multi-resource changes before applying them.
7. Test every created route and summarize what changed.

## Useful Calls

\`\`\`bash
curl "$APIAGEX_BASE_URL/api/health"

curl "$APIAGEX_BASE_URL/api/admin/automation-tokens" \\
  -H "Authorization: Bearer $APIAGEX_ADMIN_TOKEN"

curl -X POST "$APIAGEX_BASE_URL/api/admin/automation-tokens" \\
  -H "Authorization: Bearer $APIAGEX_ADMIN_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{"name":"Codex setup","ttlMinutes":60,"scopes":["schemas:manage","workflows:manage","permissions:manage","routes:read","plans:apply"]}'
\`\`\`

## Guardrails

- Never write raw tokens into source files, docs, screenshots, git commits, or logs.
- Do not ask for permanent owner credentials when a temporary automation token is available.
- Do not delete schemas, entries, workflows, or permissions unless the developer explicitly asks.
- Do not open workflow APIs to public unless the prompt or approved plan says so.
- Do not use direct database access for project automation.
`;
}

function packageJsonFile(answers: ScaffoldAnswers): string {
  const isTypeScript = answers.language === "ts";
  return `${JSON.stringify(
    {
      name: answers.target,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: isTypeScript
        ? {
            dev: "node --env-file=.env --import tsx src/index.ts",
            start: "node --env-file=.env dist/index.js",
            build: "tsc",
            types: "apiagex types",
            smoke: "apiagex smoke",
          }
        : {
            dev: "node --env-file=.env src/index.js",
            start: "node --env-file=.env src/index.js",
            build: "apiagex build",
            smoke: "apiagex smoke",
          },
      dependencies: {
        "@apiagex/server": "^0.8.15",
      },
      ...(isTypeScript
        ? {
            devDependencies: {
              "@types/node": "^24.10.1",
              tsx: "^4.21.0",
              typescript: "^5.9.3",
            },
          }
        : {}),
    },
    null,
    2,
  )}\n`;
}

function tsconfigFile(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        declaration: true,
        esModuleInterop: true,
        exactOptionalPropertyTypes: true,
        forceConsistentCasingInFileNames: true,
        module: "NodeNext",
        moduleResolution: "NodeNext",
        noUncheckedIndexedAccess: true,
        outDir: "dist",
        rootDir: "src",
        skipLibCheck: true,
        strict: true,
        target: "ES2022",
        types: ["node"],
      },
      include: ["src/**/*.ts"],
    },
    null,
    2,
  )}\n`;
}

function envFile(answers: ScaffoldAnswers, includeSecrets: boolean): string {
  const lines = [
    `APIAGEX_DATABASE_PROVIDER=${answers.databaseProvider}`,
    ...databaseEnvLines(answers),
    "APIAGEX_UPLOADS_PATH=.apiagex/uploads",
    `APIAGEX_SECRET=${includeSecrets ? answers.appSecret : "change-me"}`,
    `HOST=${answers.host}`,
    `PORT=${answers.port}`,
  ];
  if (answers.bootstrapOwner) {
    lines.push(
      `APIAGEX_OWNER_EMAIL=${answers.ownerEmail ?? "owner@apiagex.local"}`,
      `APIAGEX_OWNER_PASSWORD=${includeSecrets ? answers.ownerPassword ?? "" : "change-me-after-first-start"}`,
    );
  } else {
    lines.push(
      "# APIAGEX_OWNER_EMAIL=owner@apiagex.local",
      "# APIAGEX_OWNER_PASSWORD=change-me-after-first-start",
    );
  }
  return `${lines.join("\n")}\n`;
}

function databaseConfig(answers: ScaffoldAnswers): Record<string, string> {
  if (answers.databaseProvider === "sqlite") return { provider: "sqlite", path: answers.databasePath };
  return { provider: answers.databaseProvider, urlEnv: "APIAGEX_DATABASE_URL" };
}

function databasePlanLine(answers: ScaffoldAnswers): string {
  if (answers.databaseProvider === "sqlite") return `- SQLite path: ${answers.databasePath}`;
  return `- Database URL: ${answers.databaseUrl ?? defaultDatabaseUrl(answers.databaseProvider)}`;
}

function databaseEnvLines(answers: ScaffoldAnswers): string[] {
  if (answers.databaseProvider === "sqlite") return [`APIAGEX_DATABASE_PATH=${answers.databasePath}`];
  return [`APIAGEX_DATABASE_URL=${answers.databaseUrl ?? defaultDatabaseUrl(answers.databaseProvider)}`];
}

function defaultDatabaseUrl(provider: Exclude<ScaffoldAnswers["databaseProvider"], "sqlite">): string {
  if (provider === "postgres") return "postgres://apiagex:change-me@localhost:5432/apiagex";
  return "mysql://apiagex:change-me@localhost:3306/apiagex";
}

function entrySourcePath(answers: ScaffoldAnswers): string {
  return `src/index.${answers.language === "ts" ? "ts" : "js"}`;
}

function customRoutesSourcePath(answers: ScaffoldAnswers): string {
  return `src/custom-routes.${answers.language === "ts" ? "ts" : "js"}`;
}

function languageLabel(language: ScaffoldAnswers["language"]): string {
  return language === "ts" ? "TypeScript" : "JavaScript";
}

function serverEntryFileJs(): string {
  return `import { startApiagex } from "@apiagex/server";
import { registerCustomRoutes } from "./custom-routes.js";

const ownerEmail = process.env.APIAGEX_OWNER_EMAIL;
const ownerPassword = process.env.APIAGEX_OWNER_PASSWORD;

await startApiagex({
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 4000),
  ...(ownerEmail && ownerPassword
    ? { initialOwner: { email: ownerEmail, password: ownerPassword } }
    : {}),
  customRoutes: registerCustomRoutes,
});
`;
}

function serverEntryFileTs(): string {
  return `import { startApiagex } from "@apiagex/server";
import { registerCustomRoutes } from "./custom-routes.js";

const ownerEmail = process.env.APIAGEX_OWNER_EMAIL;
const ownerPassword = process.env.APIAGEX_OWNER_PASSWORD;

await startApiagex({
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 4000),
  ...(ownerEmail && ownerPassword
    ? { initialOwner: { email: ownerEmail, password: ownerPassword } }
    : {}),
  customRoutes: registerCustomRoutes,
});
`;
}

function customRoutesFileJs(): string {
  return `export async function registerCustomRoutes(app, apiagex) {
  app.get("/health", async () => ({
    ok: true,
    service: "custom-api",
  }));

  app.get("/schema-count", async () => ({
    ok: true,
    count: (await apiagex.schemas.list()).length,
  }));

  app.post("/orders/:entryId/pay", async (request, reply) => {
    const entry = await apiagex.entries.getById(request.params.entryId);
    if (!entry) return reply.code(404).send({ ok: false, error: "ORDER_NOT_FOUND" });
    if (entry.data.status !== "pending") {
      return reply.code(400).send({ ok: false, error: "ORDER_NOT_PAYABLE" });
    }

    return {
      ok: true,
      entry: await apiagex.entries.update(entry.id, {
        data: { ...entry.data, status: "paid" },
      }),
    };
  });
}
`;
}

function customRoutesFileTs(): string {
  return `import type { RegisterApiagexCustomRoutes } from "@apiagex/server";

type OrderData = {
  status: "pending" | "paid" | "cancelled";
  paymentStatus?: "unpaid" | "paid";
  total?: number;
};

type PayOrderParams = {
  entryId: string;
};

export const registerCustomRoutes: RegisterApiagexCustomRoutes = async (app, apiagex) => {
  app.get("/health", async () => ({
    ok: true,
    service: "custom-api",
  }));

  app.get("/schema-count", async () => ({
    ok: true,
    count: (await apiagex.schemas.list()).length,
  }));

  app.post<{ Params: PayOrderParams }>("/orders/:entryId/pay", async (request, reply) => {
    const entry = await apiagex.entries.getById(request.params.entryId);
    if (!entry) return reply.code(404).send({ ok: false, error: "ORDER_NOT_FOUND" });
    const data = entry.data as OrderData;
    if (data.status !== "pending") {
      return reply.code(400).send({ ok: false, error: "ORDER_NOT_PAYABLE" });
    }

    return {
      ok: true,
      entry: await apiagex.entries.update(entry.id, {
        data: { ...data, status: "paid", paymentStatus: "paid" },
      }),
    };
  });
};
`;
}

function installCommand(packageManager: string): string {
  return packageManager === "yarn" ? "yarn install" : `${packageManager} install`;
}

function runCommand(packageManager: string, script: string): string {
  return packageManager === "npm" ? `npm run ${script}` : `${packageManager} ${script}`;
}
