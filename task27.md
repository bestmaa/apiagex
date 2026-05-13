# Apiagex Task 0.6.3 Unscoped npm Packages

This task removes the unavailable `@apiagex` npm scope from published packages and keeps the installer package as `create-apiagex`.

Ye task unavailable `@apiagex` npm scope ko published packages se remove karta hai aur installer package `create-apiagex` hi rakhta hai.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/package checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep source files under 250 lines where practical.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

#### T1030 - Move Published Packages To Unscoped Names

- Version: `0.6.3`
- Status: `completed`
- Goal: Publish without the unavailable `apiagex` npm organization.
- Persona: Maintainer whose npm account cannot create the `apiagex` org/scope.
- Success Criteria: Runtime packages publish as `apiagex-database` and `apiagex-server`; generated projects depend on `apiagex-server`; installer remains `create-apiagex`; workflow publishes packages in dependency order; lockfile is in sync for GitHub npm 10.
- Constraints: Keep `npm create apiagex@latest` possible through the `create-apiagex` package.
- Output: Package name migration, docs/context updates, lockfile update.
- Verify: Candidate package names return npm 404 before publish, standard verification, pack dry-runs, GitHub publish run.
- Commit: `Move npm packages to unscoped names`
