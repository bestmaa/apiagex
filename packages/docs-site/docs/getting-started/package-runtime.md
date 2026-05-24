# Package Runtime

Installed Apiagex projects serve the runtime, Admin UI, and compact docs from the installed packages.

## Runtime Paths

| Path | Served By | Notes |
| --- | --- | --- |
| `/adminui` | `@apiagex/server` with built Admin UI assets. | Main operator UI. |
| `/doc` | `@apiagex/docs` static build copied into server dist. | Compact public docs. |
| `/readme` | `@apiagex/docs` static build copied into server dist. | Project summary. |
| `/api` | `@apiagex/server` Fastify app. | API root. |

## Build Checks

```bash
npm run build
npm run test
npm run smoke
```

The root build currently builds docs, Admin UI, database, server, and `create-apiagex`.

::: tip Hinglish
Package install ke baad Admin UI alag se copy karne ki jarurat nahi hoti. Server build me Admin UI aur compact docs assets include hote hain.
:::
