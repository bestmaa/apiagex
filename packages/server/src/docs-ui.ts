import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DocsPageSlug, DocsUiAsset } from "./docs-ui.type.js";

const pageTitles: Record<DocsPageSlug, string> = {
  doc: "Apiagex Docs",
  readme: "Apiagex Readme",
};

export function resolveDocsUiAsset(slug: DocsPageSlug): DocsUiAsset {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const packagedRoot = join(currentDir, "docs-pages");
  const root = existsSync(join(packagedRoot, slug, "index.html"))
    ? packagedRoot
    : join(currentDir, "../../docs/dist");
  return { root, pagePath: join(root, slug, "index.html") };
}

export async function readDocsPage(slug: DocsPageSlug): Promise<string> {
  const asset = resolveDocsUiAsset(slug);
  if (!existsSync(asset.pagePath)) {
    return renderMissingDocsBuild(slug);
  }
  return readFile(asset.pagePath, "utf8");
}

function renderMissingDocsBuild(slug: DocsPageSlug): string {
  const title = pageTitles[slug];
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body><main><h1>${title}</h1><p>Docs build is missing. Run npm run build -w @apiagex/docs, or run npm run build from the workspace root, then reload /${slug}.</p></main></body>
</html>`;
}
