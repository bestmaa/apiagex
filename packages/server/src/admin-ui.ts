import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AdminUiAsset } from "./admin-ui.type.js";

export function resolveAdminUiAsset(): AdminUiAsset {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const root = join(currentDir, "../../admin/dist/public");
  return { root, indexPath: join(root, "index.html") };
}

export async function readAdminIndex(): Promise<string> {
  const asset = resolveAdminUiAsset();
  if (!existsSync(asset.indexPath)) {
    return renderMissingAdminBuild();
  }
  return readFile(asset.indexPath, "utf8");
}

function renderMissingAdminBuild(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Apiagex Admin UI</title></head>
<body><main><h1>Apiagex Admin UI</h1><p>Run npm run build to generate React Admin UI.</p></main></body>
</html>`;
}
