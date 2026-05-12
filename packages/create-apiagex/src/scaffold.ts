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
            "@apiagex/server": "^0.6.1",
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
      content: `${JSON.stringify({ database: { provider: "sqlite", url: "file:.apiagex/apiagex.sqlite" } }, null, 2)}\n`,
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

## Next commands

\`\`\`bash
${installCommand(answers.packageManager)}
${runCommand(answers.packageManager, "dev")}
\`\`\`

Open /adminui to create the first owner, /doc for API docs, and /readme for the readable project summary.

## Relation Modeling

English: Create the target schema first, then add relation fields to the source schema in /adminui. Use one-to-one for Profile to User, many-to-one for Article to Category, one-to-many for Author to Articles, and many-to-many for Articles to Tags.

Hinglish: Pehle target schema banao, phir /adminui me source schema par relation fields add karo. Profile to User ke liye one-to-one, Article to Category ke liye many-to-one, Author to Articles ke liye one-to-many, aur Articles to Tags ke liye many-to-many use karo.
`;
}

function docsReadme(): string {
  return "# Apiagex Project Docs\n\nUse /doc for generated API docs and /readme for the project summary.\n\nRelation docs: /doc explains relation field types, entry payloads, populate query options, Admin UI entry pickers, and common errors.\n";
}

function installCommand(packageManager: string): string {
  return packageManager === "yarn" ? "yarn install" : `${packageManager} install`;
}

function runCommand(packageManager: string, script: string): string {
  return packageManager === "npm" ? `npm run ${script}` : `${packageManager} ${script}`;
}
