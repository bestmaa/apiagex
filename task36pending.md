# Apiagex Task 36 Pending - Native Admin UI AI Builder

Task 36 is the later product feature where Apiagex Admin UI itself gets an AI builder. Users will type what they want, preview the schemas/workflow APIs/permissions that will be created, and approve the plan inside Admin UI.

Task 36 baad ka feature hai jisme Admin UI ke andar AI prompt builder hoga. User bolega kya banana hai, Apiagex preview dikhayega, phir approve ke baad schemas, workflow APIs, permissions create honge.

## Queue Rules

- Start this only after Task 35 Codex project integration is stable.
- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run task verification plus standard verification.
- Mark tasks `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Do not store OpenAI/provider API keys in workflow JSON or frontend code.
- AI-generated changes must use preview/apply safety, not direct blind mutation.
- User-facing docs must be English + Hinglish.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## GPT-5.5 Low-Token Prompt

```text
Apiagex task36 runner.
Read agent.md, PROJECT_CONTEXT.md, task35inprogress.md, task36pending.md. Pick first task36 `Status: pending` only.
Goal: Native Admin UI AI Builder after Codex/MCP integration is stable.
Do not bypass preview/apply safety. Do not store provider secrets in frontend/workflow JSON.
Strict TS, docs English+Hinglish, Admin UI browser checks desktop+mobile.
Run npm run check, npm run smoke, npm audit --audit-level=high, git diff --check.
```

## Product Contract

The target Admin UI flow:

1. Admin opens AI Builder inside Apiagex Admin UI.
2. Admin types a goal such as "Create an order status API for customers".
3. Apiagex asks the configured model to produce an AI API plan.
4. Apiagex validates and previews the plan before applying anything.
5. Admin approves the plan.
6. Apiagex creates schemas, workflows, permissions, docs/examples, and test calls.
7. Admin can audit what AI created and roll back safe changes where possible.

Target Admin UI flow Hinglish:

1. Admin Apiagex Admin UI me AI Builder open karta hai.
2. Admin goal likhta hai, jaise order status API banana hai.
3. Apiagex configured model se AI API plan banwata hai.
4. Apply se pehle plan validate aur preview hota hai.
5. Admin approve karta hai.
6. Apiagex schemas, workflows, permissions, docs/examples, aur test calls create karta hai.
7. Admin audit dekh sakta hai aur possible changes rollback kar sakta hai.

## Queue

### Phase 1: Native AI Builder Product Plan

#### T3601 - Plan Native Admin UI AI Builder

- Version: `v0.20.0`
- Status: `pending`
- Goal: Define the Admin UI AI Builder feature scope.
- Persona: Product planner; keep the AI builder powerful but safe.
- Success Criteria: Plan covers prompt box, preview/apply, model provider config, token safety, audit history, rollback, and UX states.
- Constraints: Planning only.
- Output: Docs only.
- Strict Rule: Do not implement model calls in Admin UI yet.
- Verify: Documentation review.
- Commit: `Plan Admin UI AI builder`

#### T3602 - Define Model Provider Settings

- Version: `v0.20.1`
- Status: `pending`
- Goal: Define how admins configure AI provider credentials and model choices.
- Persona: Security-minded settings designer; secrets must stay server-side.
- Success Criteria: Contract covers provider name, model, encrypted/hidden secret handling, test connection, and disabled state.
- Constraints: Contract/types/docs only.
- Output: Types and docs.
- Strict Rule: Provider secrets must never be exposed to browser JavaScript after save.
- Verify: Typecheck and docs review.
- Commit: `Define AI provider settings`

### Phase 2: Admin UI AI Plan Preview

#### T3603 - Add AI Builder Admin UI Shell

- Version: `v0.20.2`
- Status: `pending`
- Goal: Add an Admin UI page for AI Builder without executing model calls yet.
- Persona: SaaS UI designer; make the workflow practical and calm.
- Success Criteria: Page includes goal input, plan preview placeholder, validation area, and disabled apply state.
- Constraints: UI shell only.
- Output: React UI and route.
- Strict Rule: No marketing hero; this is an operational tool screen.
- Verify: Admin UI browser desktop/mobile check.
- Commit: `Add AI builder UI shell`

#### T3604 - Connect AI Builder To Plan Preview API

- Version: `v0.20.3`
- Status: `pending`
- Goal: Let Admin UI submit a prompt and receive a validated AI API plan preview.
- Persona: Product engineer; keep users in control before mutation.
- Success Criteria: UI shows schemas, workflow routes, permissions, warnings, and test examples from the preview.
- Constraints: Requires Task 35 plan preview/apply APIs.
- Output: UI integration, tests, docs.
- Strict Rule: Apply must stay disabled if preview has blocking validation errors.
- Verify: UI tests and browser checks.
- Commit: `Connect AI builder preview`

### Phase 3: Admin UI AI Apply And Audit

#### T3605 - Add AI Builder Apply Flow

- Version: `v0.20.4`
- Status: `pending`
- Goal: Let admins approve and apply a validated AI API plan.
- Persona: Workflow safety engineer; avoid surprise backend changes.
- Success Criteria: Apply requires confirmation, creates an audit record, shows success/failure details, and links to created APIs.
- Constraints: Must use existing preview/apply backend APIs.
- Output: UI integration and tests.
- Strict Rule: Do not apply a stale plan if the backend state changed after preview.
- Verify: UI tests, API tests, browser flow.
- Commit: `Add AI builder apply flow`

#### T3606 - Add AI Builder Audit History

- Version: `v0.20.5`
- Status: `pending`
- Goal: Show past AI builder runs and created resources.
- Persona: Admin operations designer; make AI changes traceable.
- Success Criteria: Admin can view prompt, plan summary, created resources, status, user, and timestamps.
- Constraints: Do not show raw provider secrets or automation tokens.
- Output: UI, backend query if needed, tests.
- Strict Rule: Audit history must remain useful even if resources are later deleted.
- Verify: Tests and browser check.
- Commit: `Add AI builder audit history`

### Phase 4: Native AI Builder Release

#### T3607 - Release Native Admin UI AI Builder

- Version: `v0.20.6`
- Status: `pending`
- Goal: Stabilize and release the native Admin UI AI Builder.
- Persona: Release manager; ship only after safe preview/apply works.
- Success Criteria: Full checks pass, browser checks pass, docs explain setup/use, and npm publish succeeds with approval.
- Constraints: Publish only with explicit maintainer approval.
- Output: Published packages and verification notes.
- Strict Rule: Never publish if release checks fail.
- Verify: Standard verification, browser checks, npm view versions.
- Commit: `Release Admin UI AI builder`
