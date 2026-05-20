# Apiagex Task 34 Queue - Visual Workflow API Builder

Task 34 plans a no-code/low-code Workflow API Builder for Apiagex. The goal is to let admins create custom business APIs from Admin UI using saved workflow definitions, first with simple forms and later with a graph editor.

Task 34 ka goal Apiagex me visual Workflow API Builder banana hai. Admin UI se custom business APIs create honge, pehle simple list/form se aur later graph editor se.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep product docs in English + Hinglish where user-facing.
- Browser-facing Admin UI tasks must be verified on desktop and mobile.
- Do not break existing smoke flow: `npm run smoke` must keep passing.
- Workflow APIs must use the same secure `/api/custom` namespace unless a task explicitly changes it.
- Workflow APIs must integrate with Custom API Permissions before they are callable by clients.
- Workflow execution must be deterministic and must not run arbitrary user JavaScript in the MVP.
- Workflow secrets must not be stored in plain workflow JSON.
- Every task must include practical docs or update existing docs when behavior is user-facing.
- To save context, first scan only task headings and `Status` lines, then read the full details only for the first pending task.
- Do not read completed task bodies unless they are needed to debug or understand a dependency.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## GPT-5.5 Low-Token Prompt

```text
Apiagex task34 runner.
Read agent.md, PROJECT_CONTEXT.md, task2.md, task3.md, task32.md, task33.md, task34.md. Pick first task34 `Status: pending` only.
To save context, scan task headings/status first, then read only the first pending task details.
Before code: mark task in_progress. After verified: mark completed and commit exact message.
Keep one server: /api /adminui /doc /readme. Do not break npm run smoke.
Strict TS, files <250 lines where practical, shared types in *.type.ts, no future-task behavior.
Task34 focus: workflow storage, safe runtime executor, route triggers, CRUD/query/update/return nodes, permissions, Swagger/OpenAPI, Admin UI list/form, later React Flow graph editor, templates.
No arbitrary JS execution in MVP workflow nodes. Workflow APIs must be blocked by default and integrate with Custom API Permissions.
Docs: English+Hinglish and practical examples. Admin UI tasks: practical SaaS UI, no marketing hero/cards-inside-cards, verify desktop+mobile browser.
Run task-specific tests plus npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
```

## Task Format

Each task uses this structure:

- Version
- Status
- Goal
- Persona
- Success Criteria
- Constraints
- Output
- Strict Rule
- Verify
- Commit

## Queue

### Phase 1: Workflow Product Contract And Safety

#### T3401 - Define Workflow Builder Scope

- Version: `v0.9.0`
- Status: `completed`
- Goal: Define exactly what Workflow Builder can and cannot do in the MVP.
- Persona: Product architect; keep no-code API creation powerful but safe.
- Success Criteria: Docs explain Workflow Builder purpose, route trigger, node types, permission model, safety limits, and future graph editor plan.
- Constraints: Planning only; no runtime behavior.
- Output: Architecture notes in `docs/README.md` or a dedicated workflow docs file, plus task34 status update.
- Strict Rule: Do not claim arbitrary code execution or plugin marketplace support.
- Verify: Documentation review and standard verification.
- Commit: `Define workflow builder scope`

#### T3402 - Define Workflow JSON Contract

- Version: `v0.9.1`
- Status: `completed`
- Goal: Create shared TypeScript types for workflow definitions.
- Persona: API contract designer; make saved workflows stable across Admin UI, runtime, docs, and tests.
- Success Criteria: Types define workflow id, name, method, path, active flag, nodes, edges or ordered steps, node ids, and version field.
- Constraints: Types only unless minimal tests are useful.
- Output: `workflow.type.ts` or equivalent shared types.
- Strict Rule: Workflow path must normalize under `/api/custom`.
- Verify: Typecheck and standard verification.
- Commit: `Define workflow contract`

#### T3403 - Define Supported MVP Node Types

- Version: `v0.9.2`
- Status: `completed`
- Goal: Define MVP nodes: route trigger, validate body, query entries, get entry, create entry, update entry, delete entry, if/else, return response, and set variable.
- Persona: Workflow runtime designer; avoid vague nodes that cannot be tested.
- Success Criteria: Each node type has typed input config, output contract, failure behavior, and practical example.
- Constraints: Contract/docs only.
- Output: Node type definitions and docs.
- Strict Rule: No arbitrary JavaScript/function node in MVP.
- Verify: Typecheck and documentation review.
- Commit: `Define workflow node types`

#### T3404 - Define Workflow Expression Syntax

- Version: `v0.9.3`
- Status: `completed`
- Goal: Define a small safe expression/template syntax for values like `{{body.email}}`, `{{steps.findUser.entry.id}}`, and `{{vars.total}}`.
- Persona: Runtime safety engineer; make expressions useful without running unsafe code.
- Success Criteria: Docs and types describe allowed roots: `body`, `params`, `query`, `headers`, `steps`, `vars`, and safe literals.
- Constraints: Planning/type contract only.
- Output: Expression contract docs and placeholder types.
- Strict Rule: Do not use `eval`, `new Function`, or arbitrary JS parsing.
- Verify: Typecheck and standard verification.
- Commit: `Define workflow expressions`

#### T3405 - Define Workflow Error Model

- Version: `v0.9.4`
- Status: `completed`
- Goal: Define stable workflow error codes for validation, missing schema, missing entry, permission denied, node failure, and bad route config.
- Persona: API reliability engineer; make workflow failures predictable.
- Success Criteria: Error code list exists and each error maps to an HTTP status.
- Constraints: Contract/docs only.
- Output: Error type definitions and docs.
- Strict Rule: Do not return raw stack traces to API clients.
- Verify: Typecheck and documentation review.
- Commit: `Define workflow errors`

### Phase 2: Workflow Storage And Repository

#### T3406 - Add Workflow Database Tables

- Version: `v0.9.5`
- Status: `completed`
- Goal: Add workflow storage tables for SQLite, PostgreSQL, and MySQL.
- Persona: Database engineer; keep provider support consistent.
- Success Criteria: Tables store workflow id, name, method, path, active, definition JSON, createdAt, updatedAt, lastRunAt, and version.
- Constraints: Additive migration only; do not break existing databases.
- Output: Foundation SQL, additive migrations, provider migrations, and migration tests.
- Strict Rule: Existing custom API route tables must not be removed or repurposed.
- Verify: Database migration tests and standard verification.
- Commit: `Add workflow tables`

#### T3407 - Build Workflow Repository

- Version: `v0.9.6`
- Status: `completed`
- Goal: Add CRUD repository functions for workflow definitions.
- Persona: Backend repository engineer; keep persistence isolated and testable.
- Success Criteria: Create, list, get, update, delete, activate/deactivate functions exist with tests.
- Constraints: No runtime route registration yet.
- Output: Workflow repository and types.
- Strict Rule: Repository must validate unique method/path combination.
- Verify: Repository tests and standard verification.
- Commit: `Add workflow repository`

#### T3408 - Add Workflow Definition Validation

- Version: `v0.9.7`
- Status: `completed`
- Goal: Validate workflow definitions before save.
- Persona: Validation engineer; reject broken workflow configs early.
- Success Criteria: Invalid method, path, duplicate node ids, unknown node type, missing required config, and disconnected return node are rejected.
- Constraints: No runtime execution yet.
- Output: Validator helpers and tests.
- Strict Rule: Invalid workflow JSON must not be saved silently.
- Verify: Validator tests and standard verification.
- Commit: `Validate workflow definitions`

#### T3409 - Add Workflow Route Registry Sync

- Version: `v0.9.8`
- Status: `completed`
- Goal: Sync active workflow APIs into the existing custom API route registry.
- Persona: Access-control engineer; make workflow APIs visible in Custom API Permissions automatically.
- Success Criteria: Active workflow route appears in `custom_api_routes`; inactive workflow route becomes inactive after sync.
- Constraints: Do not execute workflow yet.
- Output: Registry sync logic and tests.
- Strict Rule: Workflow APIs must be blocked by default until role/public permission is allowed.
- Verify: Custom API route repository tests and standard verification.
- Commit: `Sync workflow routes`

#### T3410 - Add Workflow Audit Metadata

- Version: `v0.9.9`
- Status: `completed`
- Goal: Track created/updated actor metadata for workflows.
- Persona: Admin audit engineer; support future “who changed this workflow” display.
- Success Criteria: Workflow records store createdBy/updatedBy fields where admin auth context is available.
- Constraints: Use current owner/admin session model.
- Output: Schema, repository, and admin route updates.
- Strict Rule: Do not expose sensitive auth token data in audit fields.
- Verify: Backend tests and standard verification.
- Commit: `Add workflow audit metadata`

### Phase 3: Runtime Executor Foundation

#### T3411 - Build Workflow Execution Context

- Version: `v0.10.0`
- Status: `completed`
- Goal: Create execution context shape for request body, params, query, headers, vars, step outputs, and response.
- Persona: Runtime engineer; create a clean base for all nodes.
- Success Criteria: Context type and helper functions exist with unit tests.
- Constraints: No Fastify route execution yet.
- Output: Runtime context module.
- Strict Rule: Headers available to expressions must exclude sensitive internal auth values unless explicitly allowed.
- Verify: Unit tests and standard verification.
- Commit: `Add workflow execution context`

#### T3412 - Implement Safe Template Resolver

- Version: `v0.10.1`
- Status: `completed`
- Goal: Resolve `{{path.to.value}}` templates safely from workflow context.
- Persona: Runtime safety engineer; avoid arbitrary code execution.
- Success Criteria: Resolver supports string interpolation, whole-value substitution, arrays, objects, missing-path errors, and tests.
- Constraints: No external expression engine unless reviewed.
- Output: Template resolver module.
- Strict Rule: Must not use `eval` or `new Function`.
- Verify: Unit tests and standard verification.
- Commit: `Add workflow template resolver`

#### T3413 - Implement Validate Body Node

- Version: `v0.10.2`
- Status: `completed`
- Goal: Add runtime support for required fields, simple type checks, email checks, min/max length, and enum validation.
- Persona: API validation engineer; make common register/login validation possible.
- Success Criteria: Validate node passes valid payloads and returns configured error response for invalid payloads.
- Constraints: Keep validation schema small; do not introduce full JSON Schema yet.
- Output: Validate node executor and tests.
- Strict Rule: Failed validation must stop the workflow unless configured otherwise.
- Verify: Node tests and standard verification.
- Commit: `Add workflow validation node`

#### T3414 - Implement Entry Query Node

- Version: `v0.10.3`
- Status: `completed`
- Goal: Query content entries from workflow using schema slug, search, limit, offset, and simple field filters.
- Persona: Backend workflow engineer; let workflows read content data.
- Success Criteria: Node can query `users`, `orders`, or any schema by slug and expose result in step outputs.
- Constraints: Reuse existing `apiagex.entries.query` or repository behavior.
- Output: Query node executor and tests.
- Strict Rule: Node must not bypass content data validation, but workflow execution itself is controlled by custom API permission.
- Verify: Node tests and standard verification.
- Commit: `Add workflow query node`

#### T3415 - Implement Entry Get Node

- Version: `v0.10.4`
- Status: `completed`
- Goal: Read one entry by id from workflow.
- Persona: Workflow API engineer; support detail and approval APIs.
- Success Criteria: Node reads entry id from params/body/template and exposes entry output or not-found behavior.
- Constraints: Use existing entry repository/helpers.
- Output: Get node executor and tests.
- Strict Rule: Missing entry must produce a predictable workflow error or configured response.
- Verify: Node tests and standard verification.
- Commit: `Add workflow get entry node`

#### T3416 - Implement Entry Create Node

- Version: `v0.10.5`
- Status: `completed`
- Goal: Create content entries from workflow data mapping.
- Persona: Business API engineer; support register/order/create ticket flows.
- Success Criteria: Node maps body/params/query/template values into `{ data }` and creates a valid entry.
- Constraints: Reuse existing entry validation.
- Output: Create node executor and tests.
- Strict Rule: Unknown fields and invalid types must fail with existing validation errors.
- Verify: Node tests and standard verification.
- Commit: `Add workflow create entry node`

#### T3417 - Implement Entry Update Node

- Version: `v0.10.6`
- Status: `completed`
- Goal: Update an entry by id from workflow data mapping.
- Persona: Workflow API engineer; support order status, approval, and profile update flows.
- Success Criteria: Node updates valid entries, merges or replaces according to documented rule, and exposes updated entry.
- Constraints: Choose one update behavior and document it.
- Output: Update node executor and tests.
- Strict Rule: Update behavior must match existing entry API semantics.
- Verify: Node tests and standard verification.
- Commit: `Add workflow update entry node`

#### T3418 - Implement Entry Delete Node

- Version: `v0.10.7`
- Status: `completed`
- Goal: Delete entries from workflow when explicitly configured.
- Persona: Data safety engineer; make delete powerful but deliberate.
- Success Criteria: Delete node requires explicit entry id and returns deleted status.
- Constraints: Use existing relation delete guards.
- Output: Delete node executor and tests.
- Strict Rule: Delete node must never run from an empty or unresolved id.
- Verify: Node tests and standard verification.
- Commit: `Add workflow delete entry node`

#### T3419 - Implement If Else Node

- Version: `v0.10.8`
- Status: `completed`
- Goal: Add simple branching based on equality, existence, boolean, and comparison conditions.
- Persona: Workflow logic engineer; support “if user exists return error else create” flow.
- Success Criteria: Branching controls next node path and supports clear test cases.
- Constraints: Keep condition syntax small and typed.
- Output: If/else node executor and tests.
- Strict Rule: Conditions must use safe expression resolver only.
- Verify: Branching tests and standard verification.
- Commit: `Add workflow branch node`

#### T3420 - Implement Return Response Node

- Version: `v0.10.9`
- Status: `completed`
- Goal: Add a final return node that shapes HTTP status and response body.
- Persona: API contract engineer; make workflow API output predictable.
- Success Criteria: Return node can use templates from request and step outputs and set status code.
- Constraints: Do not expose internal context by default.
- Output: Return node executor and tests.
- Strict Rule: Workflow without a return node must fail validation.
- Verify: Node tests and standard verification.
- Commit: `Add workflow return node`

#### T3421 - Build Ordered Workflow Executor

- Version: `v0.11.0`
- Status: `completed`
- Goal: Execute workflow nodes in ordered/edge-defined sequence.
- Persona: Runtime engineer; connect individual nodes into a full workflow.
- Success Criteria: Executor runs happy path, branch path, node failure path, and return path with tests.
- Constraints: Start with ordered/list execution if graph runtime is not ready.
- Output: Workflow executor module.
- Strict Rule: Add max node execution limit to prevent infinite loops.
- Verify: Runtime tests and standard verification.
- Commit: `Add workflow executor`

### Phase 4: Runtime Routes And API Integration

#### T3422 - Register Workflow Routes At Server Start

- Version: `v0.11.1`
- Status: `completed`
- Goal: Register active workflow APIs as Fastify routes under `/api/custom`.
- Persona: Server engineer; make saved workflows callable as APIs.
- Success Criteria: Active workflow `POST /register` becomes callable at `POST /api/custom/register`.
- Constraints: Must coexist with code-based custom routes.
- Output: Server registration module and tests.
- Strict Rule: Conflicting code custom route and workflow route must fail clearly or choose a documented precedence.
- Verify: Server route tests and standard verification.
- Commit: `Register workflow API routes`

#### T3423 - Enforce Custom API Permissions On Workflow Routes

- Version: `v0.11.2`
- Status: `completed`
- Goal: Ensure workflow APIs use the existing Custom API Permissions system.
- Persona: Security engineer; keep workflow APIs blocked by default.
- Success Criteria: Calls without allowed public/token role are blocked; allowed public/token calls pass.
- Constraints: Reuse existing custom API auth logic.
- Output: Permission integration tests.
- Strict Rule: Owner/admin session must not bypass workflow API client permissions.
- Verify: Allowed/blocked API tests and standard verification.
- Commit: `Protect workflow APIs`

#### T3424 - Add Workflow Admin APIs

- Version: `v0.11.3`
- Status: `completed`
- Goal: Expose admin endpoints to list/create/read/update/delete workflows.
- Persona: Admin API engineer; power the Admin UI builder.
- Success Criteria: Admin APIs exist under `/api/admin/workflows` and require admin auth.
- Constraints: No Admin UI yet.
- Output: Admin route types, handlers, tests, OpenAPI admin docs if enabled.
- Strict Rule: Admin APIs must not allow invalid workflow definitions.
- Verify: Admin route tests and standard verification.
- Commit: `Add workflow admin APIs`

#### T3425 - Add Workflow OpenAPI Output

- Version: `v0.11.4`
- Status: `completed`
- Goal: Show active workflow APIs in Swagger/OpenAPI with method, path, summary, request hints, and response hints.
- Persona: Developer experience engineer; make no-code APIs discoverable.
- Success Criteria: `/api/openapi.json` includes workflow routes when content docs are enabled.
- Constraints: Use saved workflow metadata; do not infer impossible schemas.
- Output: OpenAPI updates and tests.
- Strict Rule: Disabled workflows must not appear as active API routes.
- Verify: OpenAPI tests and standard verification.
- Commit: `Document workflow APIs in OpenAPI`

#### T3426 - Add Workflow Execution History

- Version: `v0.11.5`
- Status: `completed`
- Goal: Store recent workflow run history for debugging.
- Persona: Operator; help admins see if a workflow ran and why it failed.
- Success Criteria: History records workflow id, status, statusCode, duration, error code, createdAt, and limited request metadata.
- Constraints: Do not store full sensitive bodies by default.
- Output: Workflow run table/repository and tests.
- Strict Rule: Passwords, tokens, OTPs, and Authorization headers must not be stored.
- Verify: History tests and standard verification.
- Commit: `Add workflow run history`

#### T3427 - Add Workflow Runtime Limits

- Version: `v0.11.6`
- Status: `completed`
- Goal: Add runtime limits for max steps, timeout, response size, and query limit.
- Persona: Platform safety engineer; keep bad workflows from hurting the server.
- Success Criteria: Limits are documented, configurable internally, and tested.
- Constraints: Keep default values conservative.
- Output: Runtime guard helpers and tests.
- Strict Rule: Limit errors must be clear and must not crash the server.
- Verify: Runtime limit tests and standard verification.
- Commit: `Add workflow runtime limits`

### Phase 5: Simple Admin UI List And Form Builder

#### T3428 - Add Workflow Settings Submenu

- Version: `v0.12.0`
- Status: `completed`
- Goal: Add Settings > Workflows navigation in Admin UI.
- Persona: Admin UI engineer; make workflow builder discoverable.
- Success Criteria: Settings submenu and page route exist with empty state.
- Constraints: Page can be read-only in this task.
- Output: Admin route/page shell.
- Strict Rule: Do not add graph editor yet.
- Verify: Admin UI route tests, browser desktop/mobile, standard verification.
- Commit: `Add workflow settings page`

#### T3429 - Build Workflow List Page

- Version: `v0.12.1`
- Status: `completed`
- Goal: Show saved workflows with name, method, path, active status, updated time, and quick actions.
- Persona: Admin operator; manage workflows like APIs.
- Success Criteria: List shows loading, empty, success, error, active/inactive filter, and search.
- Constraints: Use workflow admin APIs.
- Output: Workflow list component.
- Strict Rule: List actions must not execute workflow.
- Verify: Browser checks and standard verification.
- Commit: `Build workflow list UI`

#### T3430 - Build Workflow Basics Form

- Version: `v0.12.2`
- Status: `completed`
- Goal: Create/edit workflow name, method, path, description, and active flag.
- Persona: API builder; make route creation straightforward.
- Success Criteria: Admin can create a basic workflow draft and edit metadata.
- Constraints: No node editing yet beyond placeholder return node.
- Output: Workflow basics form.
- Strict Rule: Path must show final mounted route `/api/custom/...`.
- Verify: Browser create/edit basics flow and standard verification.
- Commit: `Build workflow basics form`

#### T3431 - Build Simple Step Form Editor

- Version: `v0.12.3`
- Status: `completed`
- Goal: Let admins add ordered nodes using forms instead of graph editor.
- Persona: Non-coder admin; build simple flows before visual graph exists.
- Success Criteria: Add/remove/reorder steps and edit node config for validate/query/create/update/return.
- Constraints: No drag graph; use form sections.
- Output: Step editor components.
- Strict Rule: Form editor must validate before save.
- Verify: Browser workflow create with steps, tests, standard verification.
- Commit: `Build workflow step editor`

#### T3432 - Add Schema And Field Pickers In Workflow Forms

- Version: `v0.12.4`
- Status: `completed`
- Goal: Use live schemas and fields in node config forms.
- Persona: Workflow builder user; avoid typing schema/field slugs manually.
- Success Criteria: Query/create/update nodes can pick schema and fields from existing Admin UI metadata.
- Constraints: Still allow advanced/manual template values where useful.
- Output: Pickers and helper components.
- Strict Rule: Pickers must not hide actual slug values from developers.
- Verify: Browser checks with sample schema and standard verification.
- Commit: `Add workflow schema pickers`

#### T3433 - Add Workflow Test Run Panel

- Version: `v0.12.5`
- Status: `completed`
- Goal: Let admins run a workflow test from Admin UI with sample params/query/body.
- Persona: API builder; test before exposing clients.
- Success Criteria: Test panel shows request input, response output, step outputs, and errors.
- Constraints: Test run must use admin API and not require public/custom permission.
- Output: Test run admin endpoint and UI panel.
- Strict Rule: Test run must be marked as admin-only and must not publish a route by itself.
- Verify: Backend/UI tests and browser check.
- Commit: `Add workflow test runner`

#### T3434 - Add Workflow Run History UI

- Version: `v0.12.6`
- Status: `completed`
- Goal: Show recent workflow executions in Admin UI.
- Persona: Operator/debugger; understand workflow activity.
- Success Criteria: Page shows status, route, duration, error, time, and safe request metadata.
- Constraints: Requires T3426.
- Output: History UI component.
- Strict Rule: Sensitive values must remain redacted.
- Verify: Browser check and standard verification.
- Commit: `Show workflow run history`

#### T3435 - Add Workflow Activation UX

- Version: `v0.12.7`
- Status: `completed`
- Goal: Make active/inactive behavior clear in Admin UI.
- Persona: Admin operator; avoid accidentally exposing unfinished APIs.
- Success Criteria: Inactive workflows are not callable, active workflows require custom permission, UI explains both states.
- Constraints: No graph editor.
- Output: Activation controls and docs.
- Strict Rule: Activating workflow must not auto-open public permission.
- Verify: Browser/API checks and standard verification.
- Commit: `Add workflow activation UX`

### Phase 6: Permissions, Tokens, Docs, And Templates

#### T3436 - Integrate Workflow APIs With Custom API Permission UI

- Version: `v0.13.0`
- Status: `completed`
- Goal: Show workflow-created custom APIs cleanly in Settings > Custom API Permissions.
- Persona: Access-control admin; manage code custom APIs and workflow APIs in one place.
- Success Criteria: Workflow APIs have group/label, permission history, search/filter, and inactive cleanup behavior.
- Constraints: Reuse existing custom API permissions UI where possible.
- Output: UI/backend integration.
- Strict Rule: Workflow APIs must not create a second permission system.
- Verify: Browser permission flow and API tests.
- Commit: `Show workflows in custom permissions`

#### T3437 - Add Workflow API Token Example Docs

- Version: `v0.13.1`
- Status: `completed`
- Goal: Document how to call a workflow API with public permission or API token.
- Persona: Developer educator; make the first API call easy.
- Success Criteria: Docs include curl examples for public and token-protected workflow APIs.
- Constraints: Docs only.
- Output: `/doc`, README, and generated project docs updates where appropriate.
- Strict Rule: Examples must match actual route behavior.
- Verify: Documentation review and standard verification.
- Commit: `Document workflow API calls`

#### T3438 - Add Register User Workflow Template

- Version: `v0.13.2`
- Status: `completed`
- Goal: Add a template for public user registration using content entries.
- Persona: App starter builder; help users create common auth-like API.
- Success Criteria: Template creates a workflow with validate email/password, check existing user, create inactive user, and return response.
- Constraints: Password hashing may be placeholder if secure secret integration is not ready; docs must warn clearly.
- Output: Template definition, UI insertion flow, tests, docs.
- Strict Rule: Do not store plain passwords in a recommended template.
- Verify: Template tests and browser flow.
- Commit: `Add register workflow template`

#### T3439 - Add OTP Login Workflow Template Plan

- Version: `v0.13.3`
- Status: `completed`
- Goal: Plan OTP login template requirements before implementation.
- Persona: Auth system architect; avoid insecure OTP flow.
- Success Criteria: Docs explain OTP request, OTP verify, expiry, retry limit, provider config, and token issuance needs.
- Constraints: Planning only.
- Output: OTP workflow architecture notes.
- Strict Rule: Do not implement insecure OTP storage or sending in this task.
- Verify: Documentation review and standard verification.
- Commit: `Plan OTP workflow template`

#### T3440 - Add Google Login Workflow Template Plan

- Version: `v0.13.4`
- Status: `completed`
- Goal: Plan Google OAuth workflow template requirements.
- Persona: OAuth integration architect; keep external login safe.
- Success Criteria: Docs explain Google ID token verification, user lookup/create, allowed domains, and session/token handoff.
- Constraints: Planning only.
- Output: Google login workflow architecture notes.
- Strict Rule: Do not fake Google verification.
- Verify: Documentation review and standard verification.
- Commit: `Plan Google login workflow`

#### T3441 - Add Order Status Workflow Template

- Version: `v0.13.5`
- Status: `completed`
- Goal: Add a practical order status update template.
- Persona: Business workflow builder; show restaurant/kitchen-board style use case.
- Success Criteria: Template updates order status, validates allowed transitions, returns updated order, and can trigger realtime/webhook if enabled.
- Constraints: Reuse content schema and existing realtime/webhook behavior.
- Output: Template, docs, tests.
- Strict Rule: Invalid status transitions must be blocked.
- Verify: Template tests and browser/API flow.
- Commit: `Add order workflow template`

#### T3442 - Add Report Workflow Template

- Version: `v0.13.6`
- Status: `completed`
- Goal: Add a read-only report API template for aggregating content entries.
- Persona: Operations dashboard builder; generate custom reports without writing code.
- Success Criteria: Template queries entries and returns summarized counts or filtered lists.
- Constraints: Keep aggregation simple in MVP.
- Output: Template, docs, tests.
- Strict Rule: Large report queries must respect runtime limits.
- Verify: Template tests and standard verification.
- Commit: `Add report workflow template`

### Phase 7: Graph Editor With React Flow

#### T3443 - Choose Graph Editor Library And Data Model

- Version: `v0.14.0`
- Status: `completed`
- Goal: Decide graph editor implementation, likely React Flow, and map graph nodes/edges to workflow JSON.
- Persona: Frontend architect; keep visual editing compatible with runtime.
- Success Criteria: Architecture note defines graph node UI, handles, edge rules, layout, and conversion to executable workflow.
- Constraints: Planning only.
- Output: Graph editor plan.
- Strict Rule: Graph UI must not create runtime behavior that executor cannot run.
- Verify: Documentation review and standard verification.
- Commit: `Plan workflow graph editor`

#### T3444 - Add React Flow Dependency And Shell

- Version: `v0.14.1`
- Status: `completed`
- Goal: Add graph editor shell with canvas, toolbar, minimap/controls if appropriate, and empty state.
- Persona: Frontend engineer; start visual builder without breaking form builder.
- Success Criteria: Graph editor route/tab renders and can load existing workflow nodes read-only.
- Constraints: Do not remove simple form builder.
- Output: React Flow setup and read-only graph view.
- Strict Rule: Verify canvas is nonblank on desktop/mobile screenshots.
- Verify: Browser screenshots and standard verification.
- Commit: `Add workflow graph shell`

#### T3445 - Add Graph Node Components

- Version: `v0.14.2`
- Status: `completed`
- Goal: Render node cards for trigger, validate, query, create, update, branch, and return.
- Persona: Visual UX engineer; make workflow graphs understandable at a glance.
- Success Criteria: Each node shows label, type, key config summary, error state, and selected state.
- Constraints: Keep compact operational UI; no decorative node art.
- Output: Node components and CSS.
- Strict Rule: Text must fit inside nodes at desktop and mobile widths.
- Verify: Browser screenshots and standard verification.
- Commit: `Add workflow graph nodes`

#### T3446 - Add Graph Editing Interactions

- Version: `v0.14.3`
- Status: `completed`
- Goal: Allow add node, connect edge, delete node, delete edge, select node, and edit node config.
- Persona: Workflow builder; make visual editing useful.
- Success Criteria: Graph edits update workflow draft JSON and save through existing workflow APIs.
- Constraints: Must preserve validation before save.
- Output: Editable graph builder.
- Strict Rule: Invalid graph must show errors and must not save as active workflow.
- Verify: Browser graph edit flow and standard verification.
- Commit: `Enable workflow graph editing`

#### T3447 - Add Graph Auto Layout

- Version: `v0.14.4`
- Status: `completed`
- Goal: Add a simple auto-layout action for readable workflow graphs.
- Persona: Admin UX engineer; keep graphs from becoming messy.
- Success Criteria: Button arranges nodes in a predictable left-to-right or top-to-bottom flow.
- Constraints: Keep dependency small; can implement simple layout manually.
- Output: Auto-layout helper.
- Strict Rule: Auto-layout must not change execution semantics.
- Verify: Browser check and unit test if helper is pure.
- Commit: `Add workflow graph layout`

#### T3448 - Add Graph Validation Overlay

- Version: `v0.14.5`
- Status: `completed`
- Goal: Surface validation errors directly on graph nodes and edges.
- Persona: Builder support engineer; help users fix broken workflows.
- Success Criteria: Missing config, missing return node, disconnected branch, and duplicate path errors are visible in graph UI.
- Constraints: Reuse backend validator output where possible.
- Output: Graph validation UI.
- Strict Rule: UI must not disagree with backend validation.
- Verify: Browser validation scenarios and standard verification.
- Commit: `Show workflow graph validation`

### Phase 8: External Calls, Secrets, And Advanced Nodes

#### T3449 - Add Secret Store Plan

- Version: `v0.15.0`
- Status: `completed`
- Goal: Plan secure storage for provider secrets used by workflow nodes.
- Persona: Security architect; avoid leaking API keys.
- Success Criteria: Plan covers encrypted-at-rest option, env-backed secrets, Admin UI secret references, and redaction.
- Constraints: Planning only.
- Output: Secret store architecture docs.
- Strict Rule: Do not store secret values in workflow JSON.
- Verify: Documentation review and standard verification.
- Commit: `Plan workflow secrets`

#### T3450 - Add HTTP Request Node Plan

- Version: `v0.15.1`
- Status: `completed`
- Goal: Plan external HTTP request node for APIs like SMS, email, payment, and OAuth.
- Persona: Integration architect; make external calls useful and safe.
- Success Criteria: Plan covers method, URL allowlist, headers, body templates, timeout, retry, and secret references.
- Constraints: Planning only.
- Output: HTTP node architecture docs.
- Strict Rule: Do not allow unrestricted SSRF-prone URLs without a safety model.
- Verify: Documentation review and standard verification.
- Commit: `Plan workflow HTTP node`

#### T3451 - Implement HTTP Request Node

- Version: `v0.15.2`
- Status: `completed`
- Goal: Add safe external HTTP request node.
- Persona: Integration engineer; support OTP/email/payment provider calls.
- Success Criteria: Node supports method, URL, headers, body, timeout, status checks, and output mapping.
- Constraints: Requires secret/reference plan from T3449 and T3450.
- Output: HTTP node executor, tests, docs.
- Strict Rule: Secrets must be redacted from logs/history.
- Verify: Node tests with mocked HTTP client and standard verification.
- Commit: `Add workflow HTTP node`

#### T3452 - Add Hash Password Node Plan

- Version: `v0.15.3`
- Status: `completed`
- Goal: Plan password hashing support for register/login templates.
- Persona: Auth security engineer; avoid insecure user auth templates.
- Success Criteria: Plan defines hashing algorithm, verify behavior, salt, migration risk, and output shape.
- Constraints: Planning only.
- Output: Password node docs.
- Strict Rule: Do not recommend storing plain passwords.
- Verify: Documentation review and standard verification.
- Commit: `Plan workflow password nodes`

#### T3453 - Implement Hash And Verify Password Nodes

- Version: `v0.15.4`
- Status: `completed`
- Goal: Add password hash and verify nodes for workflows.
- Persona: Auth implementation engineer; enable secure register/login workflows.
- Success Criteria: Hash node stores safe hash; verify node compares password to hash; tests cover success/failure.
- Constraints: Use proven Node crypto/password hashing dependency after review.
- Output: Node executors, tests, docs.
- Strict Rule: Timing-sensitive comparisons must be handled safely.
- Verify: Security-focused tests and standard verification.
- Commit: `Add workflow password nodes`

#### T3454 - Add Issue Token Node Plan

- Version: `v0.15.5`
- Status: `completed`
- Goal: Plan how workflow APIs can issue client tokens/sessions for app users.
- Persona: Auth platform architect; avoid mixing Admin UI owner sessions and content API tokens incorrectly.
- Success Criteria: Plan explains token type, expiry, user binding, role binding, revocation, and docs.
- Constraints: Planning only.
- Output: Auth token workflow architecture docs.
- Strict Rule: Do not reuse owner/admin session tokens for public app login.
- Verify: Documentation review and standard verification.
- Commit: `Plan workflow token issuance`

### Phase 9: Documentation, Testing, And Release

#### T3455 - Write Workflow Builder Practical Guide

- Version: `v0.16.0`
- Status: `completed`
- Goal: Write practical docs for building a workflow API from scratch.
- Persona: Teacher; make a beginner successful.
- Success Criteria: Docs show create schema, create workflow route, add nodes, test run, allow permission, create token, call API.
- Constraints: English + Hinglish.
- Output: `/doc`, README, and generated project docs updates.
- Strict Rule: Docs must match current implemented UI, not future graph UI unless marked future.
- Verify: Documentation browser check and standard verification.
- Commit: `Document workflow builder`

#### T3456 - Add Workflow Builder Browser Tests

- Version: `v0.16.1`
- Status: `completed`
- Goal: Add Playwright/browser verification for workflow builder Admin UI.
- Persona: QA engineer; protect the no-code API builder flow.
- Success Criteria: Test covers login, create workflow, add steps, test run, activate, permission allow, and API call.
- Constraints: Use existing project test conventions.
- Output: Browser test script or documented Playwright verification.
- Strict Rule: Test must use isolated temporary database.
- Verify: Browser test and standard verification.
- Commit: `Test workflow builder UI`

#### T3457 - Add Provider E2E Workflow Tests

- Version: `v0.16.2`
- Status: `pending`
- Goal: Verify workflow storage and execution on SQLite, PostgreSQL, and MySQL.
- Persona: Database QA engineer; keep provider support real.
- Success Criteria: Provider E2E covers workflow tables, CRUD, and a simple create/query workflow.
- Constraints: Use existing provider E2E workflow.
- Output: Provider tests.
- Strict Rule: Do not mark provider support complete without all three DBs.
- Verify: Provider E2E and standard verification.
- Commit: `Test workflows across providers`

#### T3458 - Add Workflow Import Export Plan

- Version: `v0.16.3`
- Status: `pending`
- Goal: Plan workflow JSON import/export for templates, backups, and sharing.
- Persona: Product platform architect; support future workflow marketplace safely.
- Success Criteria: Plan covers versioning, validation, secrets exclusion, and compatibility.
- Constraints: Planning only.
- Output: Import/export docs.
- Strict Rule: Export must not include secret values.
- Verify: Documentation review and standard verification.
- Commit: `Plan workflow import export`

#### T3459 - Stabilize Workflow Builder Release

- Version: `v0.17.0`
- Status: `pending`
- Goal: Run final release hardening for the first Workflow Builder milestone.
- Persona: Release engineer; verify before publish.
- Success Criteria: Standard verification, smoke, browser checks, provider checks, docs, and manual API flow all pass.
- Constraints: Fix only release blockers.
- Output: Release notes/checkpoint docs.
- Strict Rule: Do not add new features during stabilization.
- Verify: Full release gate and npm dry-run.
- Commit: `Stabilize workflow builder`

#### T3460 - Publish Workflow Builder Release

- Version: `v0.17.1`
- Status: `pending`
- Goal: Publish the Workflow Builder release to npm after CI is green.
- Persona: Release manager; publish only verified packages.
- Success Criteria: Version bump, release check, PR/CI green, publish workflow success, npm view confirms versions.
- Constraints: Publish only when user explicitly approves.
- Output: Published packages and verification notes.
- Strict Rule: Never publish if CI or release check fails.
- Verify: GitHub workflow success and `npm view @apiagex/database version`, `npm view @apiagex/server version`, `npm view create-apiagex version`.
- Commit: `Release workflow builder`
