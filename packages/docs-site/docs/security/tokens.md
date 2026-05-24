# Tokens

Tokens connect external clients, frontend apps, Codex, and automation to Apiagex.

## Content API Tokens

Open:

```text
/adminui/#settings/api-tokens
```

<div class="screen">
  <img src="/screenshots/security/api-tokens.png" alt="Apiagex API token management screen">
</div>

Use content API tokens for generated content APIs:

```bash
curl http://127.0.0.1:4000/api/content/blog-post \
  -H "authorization: Bearer <TOKEN>"
```

## Automation Tokens

Open:

```text
/adminui/#settings/automation-tokens
```

<div class="screen">
  <img src="/screenshots/security/automation-tokens.png" alt="Apiagex automation token management screen">
</div>

Use automation tokens for AI/Codex workflows and MCP-style tools:

```bash
export APIAGEX_AUTOMATION_TOKEN="<TOKEN>"
npm run ai -- doctor
npm run ai -- context
```

## Admin Token

`APIAGEX_ADMIN_TOKEN` or `--admin-token` can create automation tokens from CLI when explicitly configured.

::: danger Keep Tokens Out Of Source
Never commit real token values to source files, docs, screenshots, `.apiagex/codex.md`, or `.env.example`.
:::
