# Codex Project AI Integration Release

Release target: `0.8.17`

## Included

- Temporary automation tokens with TTL, scopes, hashed storage, one-time raw token output, last-use tracking, and revoke APIs.
- Generated `.apiagex/codex.md` context for new projects.
- `apiagex ai context`, `apiagex ai doctor`, and `apiagex ai token`.
- `apiagex mcp` stdio MCP server using `APIAGEX_BASE_URL` and `APIAGEX_AUTOMATION_TOKEN`.
- Secure `/api/ai/*` automation APIs for MCP tools.
- AI API plan v1 types, docs, preview API, and apply API.
- Generated project README and Codex context instructions for MCP setup.

## Verification

- `npm view @apiagex/database@0.8.17 version`: `0.8.17`.
- `npm view @apiagex/server@0.8.17 version`: `0.8.17`.
- `npm view create-apiagex@0.8.17 version`: `0.8.17`.
- `npm run check`: passed, 73 test files, 317 passed, 4 skipped.
- `npm run smoke`: passed.
- `npm audit --audit-level=high`: passed, 0 vulnerabilities.
- `npm publish -w @apiagex/database --access public --tag latest --dry-run`: passed.
- `npm publish -w @apiagex/server --access public --tag latest --dry-run`: passed.
- `npm publish -w create-apiagex --access public --tag latest --dry-run`: passed.

## Publish

Published through GitHub Actions tag `npm-v0.8.17`.

- Main/dry-run workflow: success.
- Tag/publish workflow: success.
- Provider E2E workflow: success.
