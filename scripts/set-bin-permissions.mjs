import { chmod } from "node:fs/promises";
import { resolve } from "node:path";

const files = process.argv.slice(2);
if (files.length === 0) {
  throw new Error("Pass at least one bin file path.");
}

for (const file of files) {
  await chmod(resolve(process.cwd(), file), 0o755);
}
