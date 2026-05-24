# Apiagex 0.9.13 Beta

Admin UI, API Management, runtime logging, relation populate, and VitePress docs release.

## Highlights

- Publishes `@apiagex/database`, `@apiagex/server`, and `create-apiagex` at `0.9.13` under the npm `beta` tag.
- Improves the dark Admin UI shell, API Management screens, API listing, role permission inspection, and access-count visibility.
- Adds runtime API request logs backed by rotating JSONL files instead of database tables.
- Adds API log routes and Admin UI client types for inspecting runtime traffic.
- Optimizes relation populate to batch related entry lookups and avoid per-entry N+1 reads.
- Adds tests for API request JSONL rotation, relation populate batching, and updated role permission UI behavior.
- Adds `@apiagex/docs-site`, a separate VitePress documentation package under `packages/docs-site`.
- Adds long-form workflow docs for install, Admin UI login, schema builder, field types, enum/multiSelect, entries, media, relations, generated APIs, API Management, roles, tokens, webhooks, realtime, custom API code, workflow APIs, AI/Codex, MCP tools, database providers, export/import, multi-tenant preview, and troubleshooting.
- Adds Browser-captured Admin UI screenshots under `packages/docs-site/public/screenshots`.
- Adds screenshot rules and code example standards for future docs contributions.
- Adds docs-site build into the root `npm run build` verification path.
- Keeps existing `/doc` and `/readme` routes unchanged. The VitePress docs site is separate until a future server integration task explicitly changes public route serving.
- Stabilizes the API request JSONL rotation test by using a deterministic rotation threshold.
- Expands realtime frontend documentation with session-token creation, WebSocket connection code, ready/ping/event/ack/replay message shapes, and reconnect guidance.
- Expands custom API docs with the current relative-route registration model, `RegisterApiagexCustomRoutes`, `apiagex` helper context examples, permission flow, and typed schema helper guidance.
- Improves code block contrast for dark VitePress backgrounds.
- Moves local task planning files into a git-ignored `task/` folder so release commits stay focused on product code and docs.

## Safety Notes

- Do not publish docs-site packages from this task unless a maintainer explicitly asks for npm publish/release.
- Screenshots must use demo data only and must not contain real tokens, passwords, private emails, database URLs, webhook secrets, or production content.
- Token examples use `<TOKEN>` placeholders only.
- VitePress currently pulls `vite`/`esbuild` dependencies with moderate development-server advisories; `npm audit --audit-level=high` passes.

## Browser QA

- Opened the VitePress docs site in Browser at local dev URL.
- Checked desktop layout for home, Admin UI docs, and API Management docs.
- Confirmed sidebar renders.
- Confirmed Admin UI screenshots load without broken images.
- Confirmed no horizontal overflow on checked pages.
- Confirmed code blocks are readable on dark docs backgrounds.

## Verification

- `npm run release:check`
- `npm run build -w @apiagex/docs-site`
- `npm run build`
- `npm run smoke`
- `npm run test`
- `npx vitest run packages/server/tests/api-request-logs.test.ts`
- `git diff --check`
- `npm audit --audit-level=high`
- `npm publish -w @apiagex/database --access public --tag beta --dry-run`
- `npm publish -w @apiagex/server --access public --tag beta --dry-run`
- `npm publish -w create-apiagex --access public --tag beta --dry-run`
