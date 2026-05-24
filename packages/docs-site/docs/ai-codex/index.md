# AI And Codex Project Workflow

Apiagex can give Codex or another AI assistant enough project context to build frontend screens and create matching backend APIs.

## Project Context

Run:

```bash
npm run ai -- context
```

This writes:

```text
.apiagex/codex.md
```

The context file explains how the project uses Apiagex. It must not contain real token values.

## Doctor

```bash
npm run ai -- doctor
```

Doctor checks:

- Base URL
- context file
- `APIAGEX_AUTOMATION_TOKEN`
- `APIAGEX_ADMIN_TOKEN`

It does not print token values.

## Good Prompt Shape

```text
Build a restaurant menu frontend.
Use Apiagex for backend schemas and APIs.
Create schemas for categories, menu items, and orders.
Use the automation token already available in env.
Verify API calls and show me how to run the app.
```

Hinglish: AI ko token value chat me mat do agar env me set hai. Bas bolo Apiagex backend use karo aur `.apiagex/codex.md` follow karo.
