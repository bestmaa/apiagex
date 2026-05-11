# Apiagex Task 10.0.14 Queue

Task 10.0.14 stabilizes the current project by auditing every major feature, running end-to-end API and browser checks, and writing practical user-facing documentation.

Task 10.0.14 current project ko stabilize karta hai: major features audit, end-to-end API/browser checks, aur practical user-facing documentation.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep source files under 250 lines where practical.
- Browser-facing docs or UI work must verify desktop and mobile where practical.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

#### T1018 - Audit Project Features And Practical Docs

- Version: `v10.0.14`
- Status: `completed`
- Goal: Verify the current project end to end before adding more features.
- Persona: Apiagex owner preparing the CMS/API platform for real users.
- Success Criteria: API checks cover owner auth, schemas, entries, content API filters, RBAC, tokens, webhooks, realtime sessions, docs, and admin route availability; Playwright browser checks cover Admin UI and docs pages; documentation lists practical flows, expected results, common errors, and verified status.
- Constraints: Do not add unrelated product features; fix only small issues found during audit; keep docs English plus Hinglish where repository docs expect both.
- Output: Practical stabilization audit doc, context/docs updates, verification output, and a clean commit.
- Verify: Full automated checks, focused API audit script, Playwright browser audit, docs line/file checks, standard verification.
- Commit: `Audit project features and practical docs`
