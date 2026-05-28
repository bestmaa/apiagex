# Apiagex 0.9.14

Patch release for runtime and MCP version reporting.

## Fixes

- Fixes `apiagex --version` so it reports the installed `@apiagex/server` package version instead of the old hard-coded `0.8.21`.
- Fixes Apiagex MCP `initialize` metadata so `serverInfo.version` reports the installed package version.
- Adds focused tests to prevent CLI and MCP version drift in future releases.

## Verification

- `npm run build -w @apiagex/server`
- `npx vitest run packages/server/tests/runtime-cli.test.ts packages/server/tests/mcp-server.test.ts`
- `npm run smoke`
- `node packages/server/dist/cli.js --version`
