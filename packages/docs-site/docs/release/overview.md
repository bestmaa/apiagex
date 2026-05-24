# Docs Site Release

This VitePress docs package is separate from the existing compact docs route.

## Release Checklist

```bash
npm run build -w @apiagex/docs-site
npm run build
npm run test
npm run smoke
git diff --check
```

## Browser QA

- Open docs dev or preview site.
- Check desktop and mobile.
- Verify sidebar navigation.
- Verify search.
- Verify screenshots load.
- Verify code blocks do not overflow.
- Verify no secret values appear.

Do not publish packages from a docs task unless a release task explicitly requests it.
