import type { ScaffoldAnswers, ScaffoldFile } from "./create-apiagex.type.js";

export function createScaffoldFiles(answers: ScaffoldAnswers): ScaffoldFile[] {
  return [
    {
      path: "package.json",
      content: `${JSON.stringify(
        {
          name: answers.target,
          version: "0.1.0",
          private: true,
          type: "module",
          scripts: {
            dev: "apiagex dev",
            start: "apiagex start",
            build: "apiagex build",
            smoke: "apiagex smoke",
          },
          dependencies: {
            "@apiagex/server": "^0.6.2",
          },
        },
        null,
        2,
      )}\n`,
    },
    {
      path: "README.md",
      content: starterReadme(answers),
    },
    {
      path: ".gitignore",
      content: "node_modules\n.env\ndist\n.apiagex\n",
    },
    {
      path: ".env.example",
      content: "APIAGEX_DATABASE_PATH=.apiagex/apiagex.sqlite\nAPIAGEX_UPLOADS_PATH=.apiagex/uploads\nPORT=4000\nHOST=127.0.0.1\n",
    },
    {
      path: "apiagex.config.json",
      content: `${JSON.stringify(
        {
          database: { provider: "sqlite", url: "file:.apiagex/apiagex.sqlite" },
          project: { packageManager: answers.packageManager, setupMode: answers.setupMode },
        },
        null,
        2,
      )}\n`,
    },
    {
      path: "docs/README.md",
      content: docsReadme(),
    },
  ];
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
    `- Package manager: ${answers.packageManager}`,
    `- Install dependencies: ${answers.installDependencies ? "yes" : "no"}`,
    `- Initialize git: ${answers.initGit ? "yes" : "no"}`,
    `- Owner setup: ${answers.bootstrapOwner ? "create now" : "create from Admin UI"}`,
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

## Scripts

- \`${runCommand(answers.packageManager, "dev")}\`: start the local Apiagex server.
- \`${runCommand(answers.packageManager, "start")}\`: start the server for regular runtime use.
- \`${runCommand(answers.packageManager, "smoke")}\`: verify the runtime health route.
- \`${runCommand(answers.packageManager, "build")}\`: print runtime build guidance.

## Environment

Copy .env.example to .env if you need custom paths.

- APIAGEX_DATABASE_PATH: SQLite database path. Default .apiagex/apiagex.sqlite.
- APIAGEX_UPLOADS_PATH: upload folder. Default .apiagex/uploads.
- PORT: server port. Default 4000.
- HOST: server host. Default 127.0.0.1.

## Practical flow

English:

1. Create the first owner from /adminui.
2. Create a schema, for example Article with a required title field.
3. Create entries from Entries or call POST /api/content/article.
4. Create Content Roles, save permissions, then create users or API tokens.
5. Use Webhooks for external server notifications and Realtime API for live browser screens.

Hinglish:

1. /adminui se first owner create karo.
2. Schema banao, jaise required title field ke saath Article.
3. Entries screen se entry banao ya POST /api/content/article call karo.
4. Content Roles banao, permissions save karo, phir users ya API tokens create karo.
5. External server notifications ke liye Webhooks aur live browser screens ke liye Realtime API use karo.

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

Hinglish: /adminui open karo, first owner create karo, phir later login ke liye same page use karo.

## Generated APIs

English: Every schema creates /api/content/:schemaSlug. Send entry data as { "data": { ... } }.

Hinglish: Har schema /api/content/:schemaSlug create karta hai. Entry data { "data": { ... } } shape me bhejo.

## Access control

English: Content API roles are separate from Admin UI roles. Give getAll, get, create, update, delete, or manage per schema.

Hinglish: Content API roles Admin UI roles se alag hain. Har schema ke liye getAll, get, create, update, delete, ya manage do.

## Webhooks and Realtime

English: Webhooks call external URLs after content changes. Realtime API sends WebSocket events only for enabled collections.

Hinglish: Webhooks content change ke baad external URLs call karte hain. Realtime API sirf enabled collections ke liye WebSocket events bhejta hai.

Relation docs: /doc explains relation field types, entry payloads, populate query options, Admin UI entry pickers, and common errors.
`;
}

function installCommand(packageManager: string): string {
  return packageManager === "yarn" ? "yarn install" : `${packageManager} install`;
}

function runCommand(packageManager: string, script: string): string {
  return packageManager === "npm" ? `npm run ${script}` : `${packageManager} ${script}`;
}
