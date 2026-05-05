import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { docPage, readmePage } from "./content.mjs";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(packageRoot, "dist");

await rm(distRoot, { recursive: true, force: true });
await writePage("doc", docPage);
await writePage("readme", readmePage);

async function writePage(slug, page) {
  const pageDir = join(distRoot, slug);
  await mkdir(pageDir, { recursive: true });
  await writeFile(join(pageDir, "index.html"), renderPage(page), "utf8");
}

function renderPage(page) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
      color: #18212f;
      background: #f7f8fb;
    }

    body {
      margin: 0;
    }

    main {
      width: min(960px, calc(100% - 32px));
      margin: 0 auto;
      padding: 48px 0;
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(2rem, 4vw, 3.5rem);
      line-height: 1.05;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 1.15rem;
    }

    .intro {
      max-width: 780px;
      margin: 0 0 28px;
      color: #46556b;
      font-size: 1.05rem;
    }

    section {
      border-top: 1px solid #d9dee8;
      padding: 24px 0;
    }

    ul {
      display: grid;
      gap: 8px;
      margin: 0;
      padding-left: 20px;
    }

    li {
      color: #263449;
    }

    code {
      font: 0.95em ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      background: #e9edf5;
      border-radius: 4px;
      padding: 0.08rem 0.25rem;
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(page.title)}</h1>
    <p class="intro">${formatInline(page.intro)}</p>
    ${page.sections.map(renderSection).join("\n    ")}
  </main>
</body>
</html>`;
}

function renderSection(section) {
  return `<section>
      <h2>${escapeHtml(section.heading)}</h2>
      <ul>
        ${section.lines.map((line) => `<li>${formatInline(line)}</li>`).join("\n        ")}
      </ul>
    </section>`;
}

function formatInline(value) {
  return escapeHtml(value).replaceAll(/(\/api[/:A-Za-z0-9-]*|\/doc|\/readme|\/adminui|npm run [a-z:]+)/g, "<code>$1</code>");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
