# Apiagex Task 35 In Progress - Codex Project AI Integration

Task 35 focuses on making Apiagex understandable and controllable inside any user project where Apiagex is installed. The immediate goal is not an Admin UI AI button. The immediate goal is: a developer opens Codex in their frontend/project repo, gives Codex a temporary Apiagex automation token, and Codex can create the needed schemas, workflow APIs, permissions, tests, and frontend calls using the installed Apiagex backend.

Task 35 ka focus ye hai ki jisme bhi Apiagex install ho, Codex us project me Apiagex backend ko samajh sake aur temporary token se required APIs bana sake. Admin UI ke andar AI prompt button baad ka phase hai.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task verification plus standard verification.
- Mark the task `completed` only after tests/docs pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Generated project AI files must be practical for Codex and must not expose secrets.
- Automation tokens must be temporary, scoped, revocable, and one-time visible.
- Codex-facing docs must be short, deterministic, and action-oriented.
- MCP tools must call existing secure Admin APIs and must not bypass permission checks.
- Admin UI AI Builder is a later phase; do not build it before the project/Codex integration is stable.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## GPT-5.5 Low-Token Prompt

```text
Apiagex task35 runner.
Read agent.md, PROJECT_CONTEXT.md, task34.md, task35inprogress.md. Pick first task35 `Status: pending` only.
Goal: make installed Apiagex projects easy for Codex to control with a temporary automation token.
Do not build Admin UI AI prompt button until its later task.
Use secure existing Admin APIs, strict TS, docs English+Hinglish, files <250 lines where practical.
Add tests/docs for generated project Codex context, temporary token flow, MCP/tools, and workflow API generation.
Run npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
```

## Product Contract

The target user flow:

1. A developer installs Apiagex in their project.
2. They start the Apiagex backend locally or in a dev environment.
3. They generate a temporary automation token.
4. They open Codex in the project and say: "Build this frontend feature; create any backend APIs you need using Apiagex."
5. Codex reads the generated Apiagex context, calls Apiagex tools/APIs, creates schemas/workflow routes/permissions, tests them, and wires frontend calls.
6. Codex never stores the raw token in committed files.

Target user flow Hinglish:

1. Developer project me Apiagex install karta hai.
2. Apiagex backend local/dev me start hota hai.
3. Temporary automation token generate hota hai.
4. Developer Codex ko bolta hai ki frontend feature banao aur backend APIs Apiagex se bana lo.
5. Codex generated context padhkar schemas, workflow APIs, permissions, tests, aur frontend calls bana deta hai.
6. Raw token committed files me store nahi hota.

## Queue

### Phase 1: Codex Integration Contract

#### T3501 - Define Codex Project Integration Contract

- Version: `v0.18.0`
- Status: `completed`
- Goal: Define how Codex should discover and operate Apiagex inside an installed project.
- Persona: AI developer experience architect; make Codex successful with minimal prompting.
- Success Criteria: Docs describe project files, environment variables, token handling, backend base URL, schema/workflow tool flow, and safety limits.
- Constraints: Planning/docs only.
- Output: `docs/codex-project-integration.md`, README links, and task35 status update.
- Strict Rule: Do not require users to paste permanent owner credentials into Codex.
- Verify: Documentation review and standard verification.
- Commit: `Define Codex project integration`

#### T3502 - Add Temporary Automation Token Contract

- Version: `v0.18.1`
- Status: `completed`
- Goal: Define a temporary, scoped, revocable token for AI/Codex automation.
- Persona: Security engineer; allow powerful setup work without long-lived secrets.
- Success Criteria: Token contract includes TTL, one-time visible secret, hashed storage, scope for schema/workflow/permission management, audit metadata, and revocation.
- Constraints: Contract/types/docs first; implementation in next task.
- Output: Shared token types and docs.
- Strict Rule: Automation tokens must not be accepted by public content APIs unless explicitly scoped.
- Verify: Typecheck and docs review.
- Commit: `Define automation token contract`

#### T3503 - Implement Temporary Automation Tokens

- Version: `v0.18.2`
- Status: `completed`
- Goal: Implement temporary automation tokens for Codex/API builder work.
- Persona: Backend security engineer; make token flow safe and practical.
- Success Criteria: Admin API can create/list/revoke automation tokens, stores hashed tokens, enforces TTL/scopes, and logs last use.
- Constraints: Must reuse existing auth patterns where possible.
- Output: Database migration, repository, Admin API routes, tests.
- Strict Rule: Raw token is only returned once.
- Verify: Token API tests, expiry tests, standard verification.
- Commit: `Add automation tokens`

### Phase 2: Generated Project Codex Context

#### T3504 - Generate Apiagex Codex Context Files

- Version: `v0.18.3`
- Status: `completed`
- Goal: Generate Codex-readable project context when a project installs or initializes Apiagex.
- Persona: Developer experience engineer; help Codex understand Apiagex immediately.
- Success Criteria: Generated projects include `.apiagex/codex.md` with base URL, auth env var names, safe workflow, API examples, and "do not commit tokens" guidance.
- Constraints: Do not write actual secrets into files.
- Output: create-apiagex template updates and docs.
- Strict Rule: Context must be concise enough for Codex to follow without reading all docs.
- Verify: Generated project test asserts file exists and contains required guidance.
- Commit: `Generate Codex context`

#### T3505 - Add Apiagex AI Setup CLI

- Version: `v0.18.4`
- Status: `completed`
- Goal: Add CLI helpers for AI/Codex setup inside user projects.
- Persona: CLI designer; make setup a short, repeatable command.
- Success Criteria: CLI exposes commands such as `apiagex ai context`, `apiagex ai token`, and `apiagex ai doctor`.
- Constraints: Commands must work from generated projects and installed runtime package.
- Output: CLI commands, tests, docs.
- Strict Rule: CLI must print token only on explicit token creation and must warn not to commit it.
- Verify: CLI tests and generated project test.
- Commit: `Add AI setup CLI`

#### T3506 - Add Codex Frontend Workflow Guide

- Version: `v0.18.5`
- Status: `completed`
- Goal: Document the exact workflow for asking Codex to build frontend features backed by Apiagex.
- Persona: Practical tutorial writer; reduce user prompt confusion.
- Success Criteria: Docs include prompt examples, environment setup, token handling, expected Codex actions, verification commands, and rollback tips.
- Constraints: Docs only.
- Output: Docs and README links.
- Strict Rule: Examples must show temporary tokens via environment variables, not committed files.
- Verify: Documentation review.
- Commit: `Document Codex frontend workflow`

### Phase 3: MCP Tool Server For Apiagex

#### T3507 - Define Apiagex MCP Tool Contract

- Version: `v0.18.6`
- Status: `completed`
- Goal: Define MCP tools Codex/AI clients can use to control Apiagex.
- Persona: Tool API designer; expose powerful actions with predictable input/output.
- Success Criteria: Tool contract covers health, list schemas, create schema, create workflow API, test workflow, list routes, set permission, and export summary.
- Constraints: Contract/docs only.
- Output: MCP tool spec docs and shared types.
- Strict Rule: Tools must call secure Apiagex APIs, not private database internals.
- Verify: Typecheck and docs review.
- Commit: `Define Apiagex MCP tools`

#### T3508 - Implement Apiagex MCP Server

- Version: `v0.18.7`
- Status: `completed`
- Goal: Build an installable MCP server for Apiagex projects.
- Persona: Integration engineer; let Codex and other AI clients call Apiagex safely.
- Success Criteria: MCP server reads `APIAGEX_BASE_URL` and `APIAGEX_AUTOMATION_TOKEN`, exposes the defined tools, validates responses, and returns actionable errors.
- Constraints: Must not require direct DB access.
- Output: MCP package or runtime command, tests, docs.
- Strict Rule: Missing/expired token errors must be clear and must not leak secrets.
- Verify: MCP tool tests with a local Apiagex test server.
- Commit: `Add Apiagex MCP server`

#### T3509 - Add MCP Install Instructions To Generated Projects

- Version: `v0.18.8`
- Status: `completed`
- Goal: Make it easy for users to connect Codex or other AI clients to Apiagex MCP.
- Persona: Onboarding engineer; keep setup copy-paste friendly.
- Success Criteria: Generated project docs explain MCP command, env vars, token creation, and a sample Codex request.
- Constraints: Docs/template only.
- Output: Generated README and `.apiagex/codex.md` updates.
- Strict Rule: Do not assume a specific user home directory or global secret store.
- Verify: Generated project test and docs review.
- Commit: `Document MCP setup`

### Phase 4: AI API Plan Apply Safety

#### T3510 - Add AI API Plan Format

- Version: `v0.18.9`
- Status: `completed`
- Goal: Define a machine-readable plan format for AI-created Apiagex changes.
- Persona: Safety engineer; require preview before mutation when possible.
- Success Criteria: Plan format can describe schemas, workflows, permissions, seed data, and test calls.
- Constraints: Contract/types first.
- Output: Shared plan types and docs.
- Strict Rule: Plan format must not include raw secrets.
- Verify: Typecheck.
- Commit: `Define AI API plan format`

#### T3511 - Add AI Plan Preview And Apply APIs

- Version: `v0.19.0`
- Status: `completed`
- Goal: Let Codex/MCP submit a plan, preview validation, then apply it safely.
- Persona: Backend workflow engineer; avoid half-created backend state.
- Success Criteria: Preview validates all planned schemas/workflows/permissions, apply records an audit entry, and failures are deterministic.
- Constraints: Use existing repositories and workflow validation.
- Output: Admin APIs, tests, docs.
- Strict Rule: Apply must require automation/admin authorization.
- Verify: Plan preview/apply tests and smoke.
- Commit: `Add AI plan apply APIs`

### Phase 5: Release Codex Project AI Integration

#### T3512 - Release Codex Project AI Integration

- Version: `v0.19.2`
- Status: `completed`
- Goal: Stabilize and release the Codex/MCP project integration.
- Persona: Release manager; publish only verified integration.
- Success Criteria: Full checks pass, generated project flow works, MCP tools work, npm dry-run/publish succeeds, and docs explain the flow.
- Constraints: Publish only with explicit maintainer approval.
- Output: Published packages and verification notes.
- Strict Rule: Never publish if release checks fail.
- Verify: Standard verification, generated project test, MCP integration test, npm view versions.
- Commit: `Release Codex project AI integration`
