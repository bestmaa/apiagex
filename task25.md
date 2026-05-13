# Apiagex Task 0.6.1 Publish Readiness

This task prepares Apiagex packages for npm publishing and records the external steps that require maintainer credentials.

Ye task Apiagex packages ko npm publish ke liye ready karta hai aur jo external steps maintainer credentials maangte hain unko record karta hai.

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

#### T1024 - Prepare npm Packages For Publishing

- Version: `0.6.1`
- Status: `completed`
- Goal: Make published npm packages contain the runtime CLI, Admin UI assets, docs pages, and executable bins.
- Persona: Maintainer publishing Apiagex as an open-source npm package.
- Success Criteria: `apiagex-server`, `apiagex-database`, and `create-apiagex` use package `files`; server build copies built Admin UI and docs into `dist`; CLI bins stay executable; dry-run packs include the expected runtime files.
- Constraints: Do not publish without npm authentication; do not push without a configured git remote.
- Output: Publish asset copy script, package file lists, docs/context updates.
- Verify: `npm pack --dry-run --json -w apiagex-server`, `npm pack --dry-run --json -w apiagex-database`, `npm pack --dry-run --json -w create-apiagex`, standard verification.
- Commit: `Prepare npm packages for publishing`

#### T1025 - Publish npm Packages

- Version: `0.6.1`
- Status: `blocked`
- Goal: Publish the packages to npm in dependency order.
- Blocker: This machine is not logged in to npm. `npm whoami` returns `E401 Unauthorized`.
- Required Maintainer Step: Run `npm login` or provide a valid npm automation token through local npm config, and make sure the npm account can publish the `@apiagex` scope.
- Publish Order: `apiagex-database`, `apiagex-server`, then `create-apiagex`.
- Commit: `Publish Apiagex npm packages`

#### T1026 - Push Open Source Repository

- Version: `0.6.1`
- Status: `blocked`
- Goal: Push the repository to GitHub or another git host.
- Blocker: No git remote is configured in this checkout.
- Required Maintainer Step: Create the repository, then add a remote such as `git remote add origin https://github.com/<user>/apiagex.git`.
- Commit: `Push Apiagex repository`
