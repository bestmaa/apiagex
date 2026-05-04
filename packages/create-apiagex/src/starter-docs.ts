import type { InstallerAnswers } from './installer.type.js';
import type { StarterTemplate } from './starter-template.type.js';

export function createDocsFiles(answers: InstallerAnswers): StarterTemplate[] {
  return [createDocsIndexHtml(answers), createDocsCss(), createDocsAppJs()];
}

function createDocsIndexHtml(answers: InstallerAnswers): StarterTemplate {
  return {
    content: [
      '<!doctype html>',
      '<html lang="en">',
      '  <head>',
      '    <meta charset="utf-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
      `    <title>${answers.projectName} Docs</title>`,
      '    <link rel="stylesheet" href="./styles.css" />',
      '  </head>',
      '  <body>',
      '    <header class="topbar">',
      '      <div class="brand">Apiagex Docs</div>',
      '      <div class="language-toggle">',
      '        <button data-language="en" class="is-active" type="button">English</button>',
      '        <button data-language="hi" type="button">Hindi</button>',
      '      </div>',
      '    </header>',
      '    <main class="page">',
      '      <h1 data-i18n="title">Build APIs from the UI.</h1>',
      '      <p data-i18n="body">This page switches between English and Hindi.</p>',
      '    </main>',
      '    <script src="./app.js"></script>',
      '  </body>',
      '</html>',
      '',
    ].join('\n'),
    path: 'docs/index.html',
  };
}

function createDocsCss(): StarterTemplate {
  return {
    content: [
      'body {',
      '  font-family: system-ui, sans-serif;',
      '  margin: 0;',
      '  background: #f7f5ef;',
      '  color: #18212b;',
      '}',
      '.topbar {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  padding: 16px 24px;',
      '  border-bottom: 1px solid #d9d1c2;',
      '}',
      '.language-toggle button {',
      '  margin-left: 8px;',
      '  padding: 8px 12px;',
      '}',
      '.language-toggle .is-active {',
      '  font-weight: 700;',
      '}',
      '.page {',
      '  max-width: 900px;',
      '  margin: 0 auto;',
      '  padding: 48px 24px;',
      '}',
      '',
    ].join('\n'),
    path: 'docs/styles.css',
  };
}

function createDocsAppJs(): StarterTemplate {
  return {
    content: [
      'const translations = {',
      '  en: {',
      '    title: "Build APIs from the UI.",',
      '    body: "This page switches between English and Hindi.",',
      '  },',
      '  hi: {',
      '    title: "UI se APIs banao.",',
      '    body: "Ye page English aur Hindi ke beech switch hota hai.",',
      '  },',
      '};',
      '',
      'const buttons = document.querySelectorAll("[data-language]");',
      'const nodes = document.querySelectorAll("[data-i18n]");',
      '',
      'function applyLanguage(language) {',
      '  for (const node of nodes) {',
      '    const key = node.dataset.i18n;',
      '    if (key) {',
      '      node.textContent = translations[language][key];',
      '    }',
      '  }',
      '  for (const button of buttons) {',
      '    button.classList.toggle("is-active", button.dataset.language === language);',
      '  }',
      '}',
      '',
      'for (const button of buttons) {',
      '  button.addEventListener("click", () => applyLanguage(button.dataset.language || "en"));',
      '}',
      '',
      'applyLanguage("en");',
      '',
    ].join('\n'),
    path: 'docs/app.js',
  };
}
