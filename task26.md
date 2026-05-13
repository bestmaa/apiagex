# Apiagex Task 0.6.2 GitHub Publish Workflow

This task makes the open-source repository ready for manual npm publishing from GitHub Actions.

Ye task open-source repository ko GitHub Actions se manual npm publish ke liye ready karta hai.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/workflow checks pass.
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

#### T1027 - Add Manual npm Publish Workflow

- Version: `0.6.2`
- Status: `completed`
- Goal: Let maintainers publish npm packages from GitHub when they choose.
- Persona: Maintainer who wants a button-driven publish flow after pushing a release commit.
- Success Criteria: GitHub Actions workflow runs on `workflow_dispatch`; it installs dependencies, runs release checks, blocks duplicate package versions, publishes packages in dependency order, supports dry-run, supports npm dist-tags, and uses npm provenance.
- Constraints: Real publishing requires repository secret `NPM_TOKEN`; package versions must be bumped before publishing an already released version.
- Output: `.github/workflows/npm-publish.yml`, package metadata, license, docs/context updates.
- Verify: Standard verification plus `npm pack --dry-run --json` for publish packages.
- Commit: `Add GitHub npm publish workflow`
