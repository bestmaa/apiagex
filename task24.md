# Apiagex Task 10.0.15 Queue

Task 10.0.15 turns Apiagex into a Strapi-style installable product flow: a runtime CLI plus an interactive project creator that asks setup questions, scaffolds a usable app, and documents the next steps clearly.

Task 10.0.15 Apiagex ko Strapi-style installable product flow banata hai: runtime CLI plus interactive project creator jo setup questions puche, usable app scaffold kare, aur next steps clear document kare.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep source files under 250 lines where practical.
- Generated starter projects must be verified from a temporary folder.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

#### T1019 - Add Apiagex Runtime CLI

- Version: `v10.0.15`
- Status: `completed`
- Goal: Make the installed runtime expose an `apiagex` command for generated projects.
- Persona: Developer who created a new project and expects `npm run dev` to start Apiagex.
- Success Criteria: `@apiagex/server` publishes a `bin` command named `apiagex`; CLI supports `dev`, `start`, `smoke`, `--help`, and `--version`; `dev/start` run the existing Fastify server; `smoke` validates runtime health without starting a long-running server; tests cover help/version/smoke/unknown command.
- Constraints: Do not break existing `npm run dev -w @apiagex/server`; keep local persistence behavior unchanged.
- Output: Runtime CLI module, bin entry, tests, docs/context updates.
- Verify: Server CLI tests, server build, standard verification.
- Commit: `Add Apiagex runtime CLI`

#### T1020 - Add Interactive Create Apiagex Prompts

- Version: `v10.0.15`
- Status: `completed`
- Goal: Make `create-apiagex` ask practical setup questions when flags are not provided.
- Persona: User creating a CMS project for the first time.
- Success Criteria: CLI can prompt for project name, setup mode, package manager, dependency install preference, git init preference, and owner bootstrap preference; non-interactive flags still work for CI; dry-run shows selected answers; tests cover prompt-driven and flag-driven creation.
- Constraints: Use Node built-ins, avoid adding prompt dependencies for now, keep non-empty folder protection.
- Output: Prompt module, argument parser updates, tests, docs.
- Verify: create-apiagex tests and standard verification.
- Commit: `Add interactive create-apiagex prompts`

#### T1021 - Improve Generated Starter Project

- Version: `v10.0.15`
- Status: `completed`
- Goal: Generate a starter that users can understand and run immediately.
- Persona: Developer opening the generated folder after install.
- Success Criteria: Starter depends on `@apiagex/server`; scripts call `apiagex dev/start/smoke`; `.env.example`, `README.md`, `docs/README.md`, and config explain Admin UI, owner setup, schemas, roles, webhooks, realtime, persistence, and common errors in English plus Hinglish.
- Constraints: Do not generate fake application code that conflicts with Apiagex runtime.
- Output: Updated scaffold files and tests.
- Verify: Scaffold snapshot/content tests and standard verification.
- Commit: `Improve generated Apiagex starter`

#### T1022 - Verify Generated Project End To End

- Version: `v10.0.15`
- Status: `completed`
- Goal: Prove the installer output can run like a real user project.
- Persona: Maintainer checking release quality before publishing.
- Success Criteria: Test creates a temp project, runs the generated `npm run smoke` equivalent through the runtime CLI, starts the runtime on a temp port/database, checks `/api/health`, `/adminui`, `/doc`, and `/readme`, then stops cleanly.
- Constraints: Keep verification deterministic and avoid network installs in tests.
- Output: End-to-end generated-project verification test/script and docs note.
- Verify: Generated project E2E test and standard verification.
- Commit: `Verify generated Apiagex projects`

#### T1023 - Document Install And Publish Flow

- Version: `v10.0.15`
- Status: `pending`
- Goal: Explain how users install Apiagex and how maintainers verify package readiness.
- Persona: New user and future package maintainer.
- Success Criteria: Root README, create-apiagex README, server README, and project context explain `npm create apiagex@latest`, `npx create-apiagex`, generated scripts, environment variables, first owner flow, and release checks.
- Constraints: Keep docs practical, not marketing copy.
- Output: English plus Hinglish documentation updates.
- Verify: Docs build and standard verification.
- Commit: `Document Apiagex install flow`
