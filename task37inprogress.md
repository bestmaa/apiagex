# Task 37 - Published Apiagex AI/MCP Project Test

## Goal

Verify the published `0.8.17` packages in a real generated project under `project-test/my-cms`.

## Rules

- Delete only `project-test/my-cms` before recreating the project.
- Use published packages, not local workspace packages.
- Do not commit generated secrets or temporary tokens.
- Keep `project-test/` as local test output.

## Checklist

### T3701 - Recreate Test Project

- Status: `completed`
- Steps:
  - Remove existing `project-test/my-cms` if present.
  - Generate a fresh project with `create-apiagex@0.8.17`.
  - Install dependencies.
- Verify:
  - Generated package uses `@apiagex/server`.
  - `.apiagex/codex.md` exists.
  - README includes Codex/MCP setup.

### T3702 - Verify Runtime And AI CLI

- Status: `completed`
- Steps:
  - Run generated project smoke check.
  - Start Apiagex programmatically.
  - Bootstrap owner and create a temporary automation token.
  - Run `apiagex ai doctor` without printing token values.
- Verify:
  - Health route works.
  - Token starts with `agx_auto_`.
  - Doctor reports token env as set.

### T3703 - Verify MCP Tools

- Status: `completed`
- Steps:
  - Start MCP stdio process from generated project command.
  - Call `initialize`, `tools/list`, and tool calls.
  - Create schema through MCP.
  - Create workflow API through MCP.
  - List routes and export summary through MCP.
- Verify:
  - Tools are listed.
  - Schema and workflow are created through HTTP APIs.
  - MCP errors do not leak tokens.

### T3704 - Verify AI Plan Preview And Apply

- Status: `completed`
- Steps:
  - Submit a plan preview using the automation token.
  - Apply the plan.
  - Re-preview to ensure duplicate resources are skipped.
- Verify:
  - Preview returns operation summaries.
  - Apply returns applied operation IDs.
  - Duplicate preview returns warnings.

### T3705 - Summarize Result

- Status: `completed`
- Steps:
  - Record commands and final result.
  - Note any issues or warnings.

## Result

- Recreated `project-test/my-cms` from `create-apiagex@0.8.17`.
- Installed dependencies from npm; audit reported 0 high vulnerabilities.
- Verified generated project uses `@apiagex/server@0.8.17`.
- Verified `.apiagex/codex.md` and README include Codex/MCP setup.
- Found and fixed a scaffold issue: generated README referenced `npm run ai` and `npm run mcp`, but package scripts were missing.
- Verified `npm run smoke`, `npm run build`, AI token creation, `npm run ai -- doctor`, MCP stdio tools, schema/workflow creation, and AI plan preview/apply.
- Verified duplicate AI plan preview returns skip warnings.
- Verified token values were not printed by doctor or MCP outputs.
