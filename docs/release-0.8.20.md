# Apiagex 0.8.20

Patch release for the AI automation token setup flow.

## What changed

- Added project auto-connect support for Admin UI automation tokens.
- The AI Automation Tokens form now defaults to "Use in this project".
- When enabled, the server writes the one-time token to the local project `.env` as `APIAGEX_AUTOMATION_TOKEN`.
- `apiagex ai doctor`, `apiagex ai context`, and the MCP server already read the project `.env`, so users no longer need to paste the token into every terminal command.
- Generated projects now depend on `@apiagex/server` `^0.8.20`.

## Verification

- Targeted automation token route and Admin UI tests.
- Server build and Admin UI build.
- Package publish dry-runs before release.

## Publish

- Git tag: `npm-v0.8.20`
- npm packages: `@apiagex/database`, `@apiagex/server`, `create-apiagex`
