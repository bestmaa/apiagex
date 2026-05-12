import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const copies = [
  ["packages/admin/dist/public", "packages/server/dist/admin-public"],
  ["packages/docs/dist", "packages/server/dist/docs-pages"],
];

for (const [source, target] of copies) {
  const sourcePath = resolve(repoRoot, source);
  const targetPath = resolve(repoRoot, target);
  if (!existsSync(sourcePath)) continue;
  await rm(targetPath, { force: true, recursive: true });
  await mkdir(targetPath, { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true });
}
