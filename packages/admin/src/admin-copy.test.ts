import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = new URL(".", import.meta.url);
const ignoredFiles = new Set(["pages/DocsPage.tsx", "pages/WebhookVerificationDocs.tsx"]);

describe("Admin UI copy", () => {
  it("keeps non-doc admin screens English-only", () => {
    const files = listSourceFiles(sourceRoot.pathname)
      .filter((file) => !file.includes(".test."))
      .filter((file) => !ignoredFiles.has(relative(sourceRoot.pathname, file)));
    const matches = files.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return ["English:", "Hinglish:"].filter((label) => content.includes(label)).map((label) => `${relative(sourceRoot.pathname, file)}:${label}`);
    });

    expect(matches).toEqual([]);
  });
});

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(nextPath);
    if (entry.isFile() && /\.(tsx?|css)$/.test(entry.name)) return [nextPath];
    return [];
  });
}
