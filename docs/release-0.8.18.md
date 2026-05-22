# Apiagex 0.8.18 Release Notes

Release target: `0.8.18`

## What Changed

- Fixed generated project scripts so `npm run ai` starts `apiagex ai`.
- Fixed generated project scripts so `npm run mcp` starts the Apiagex MCP stdio server.
- Updated generated projects to depend on `@apiagex/server` `^0.8.18`.
- Added regression coverage for both TypeScript and JavaScript generated project scripts.

## Why

The `0.8.17` generated README and `.apiagex/codex.md` correctly documented `npm run ai` and `npm run mcp`, but the generated `package.json` did not include those scripts. This release makes the generated project match the documented Codex/MCP workflow.

## Verification

- Fresh `project-test/my-cms` recreated from `create-apiagex@0.8.17` and tested against installed `@apiagex/server@0.8.17`.
- Confirmed the missing scripts issue and fixed it in the scaffold source.
- Verified real generated-project flow with:
  - `npm install`
  - `npm run smoke`
  - `npm run build`
  - temporary automation token creation through `npm run ai -- token`
  - `npm run ai -- doctor`
  - `npm run mcp` stdio tool calls
  - schema creation through MCP
  - workflow API creation through MCP
  - AI plan preview/apply and duplicate preview warnings
- `npm run check`: passed, 73 test files, 317 passed, 4 skipped.
- `npm run smoke`: passed, 2 passed.
- `npm audit --audit-level=high`: passed, 0 vulnerabilities in the generated test project.
- `npm audit --audit-level=high`: passed, 0 vulnerabilities in the workspace.
- `npm publish -w @apiagex/database --access public --tag latest --dry-run`: passed.
- `npm publish -w @apiagex/server --access public --tag latest --dry-run`: passed.
- `npm publish -w create-apiagex --access public --tag latest --dry-run`: passed.

## Publish

Publish through GitHub Actions tag `npm-v0.8.18`.
