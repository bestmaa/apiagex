# Task 31 - Simple Custom Route Types

Goal: Make generated TypeScript project types useful inside custom routes without visible wrappers, helper functions, or generic ceremony.

## Rules

- Keep `src/custom-routes.ts` simple for users.
- Do not require `typedApiagex()`, `withApiagexTypes()`, or custom generic route wrappers.
- Use generated module augmentation so `RegisterApiagexCustomRoutes` receives project schema types automatically.
- Keep JavaScript starter working.
- Publish only after tests pass, commit is pushed, and release version is updated.

## T3101 - Module Augmentation Types

- Status: `completed`
- Task: Add `ApiagexProjectTypes` and slug-based typed entry helpers to `@apiagex/server`.
- Verify: Server build passes and generated type tests confirm module augmentation output.

## T3102 - Slug Runtime Helpers

- Status: `completed`
- Task: Let custom routes call `apiagex.entries.create/query/list/getById/update` with schema slug where useful, while keeping old schema-id calls working.
- Verify: Add runtime custom route tests for slug-based create/query.

## T3103 - Starter And Docs

- Status: `completed`
- Task: Update generated TypeScript starter and docs so users only write `RegisterApiagexCustomRoutes` and run `npm run types`.
- Verify: Remove stale typed helper docs and keep scaffold tests passing.

## T3104 - Release

- Status: `completed`
- Task: Run verification, bump release version, commit, push, publish to npm, and verify published package versions.
- Verify: `npm run check`, release check, GitHub publish workflow, and `npm view` package versions.

## Verification Results

- `npm run build -w @apiagex/server && npm run build -w create-apiagex && npx vitest run packages/server/tests/custom-routes.test.ts packages/server/tests/runtime-cli.test.ts packages/create-apiagex/tests`: passed.
- `npm run check`: passed with 49 test files, 196 tests passed, and 2 skipped.
- `npx npm@10.9.7 run release:check`: passed with build, tests, smoke, and high audit.
- GitHub publish workflow `npm-v0.8.13`: passed.
- Provider E2E workflow on `main`: passed.
- `npm view @apiagex/database version`, `npm view @apiagex/server version`, and `npm view create-apiagex version`: all returned `0.8.13`.
