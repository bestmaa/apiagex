export function extractLocalizedSection(markdown, language) {
  const lines = markdown.split(/\r?\n/);
  const marker = language === 'hi' ? '## Hindi' : '## English';
  const start = lines.findIndex((line) => line.trim() === marker);

  if (start === -1) {
    return markdown.trim();
  }

  let end = lines.length;

  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index].trim())) {
      end = index;
      break;
    }
  }

  return lines.slice(start + 1, end).join('\n').trim();
}

export function getDocumentTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);

  return match ? match[1].trim() : fallback;
}

export function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let paragraph = [];
  let listItems = [];
  let codeLines = [];
  let inCode = false;

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    output.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    output.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  const flushCode = () => {
    if (!inCode) {
      return;
    }

    output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    codeLines = [];
    inCode = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith('```')) {
      if (inCode) {
        flushCode();
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }

      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      output.push(
        `<h${heading[1].length} id="${slugify(heading[2])}">${renderInline(heading[2])}</h${heading[1].length}>`,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line.trim())) {
      flushParagraph();
      listItems.push(line.trim().replace(/^[-*]\s+/, ''));
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCode();

  return output.join('');
}

function renderInline(value) {
  let text = escapeHtml(value);
  const codePlaceholders = [];

  text = text.replace(/`([^`]+)`/g, (_match, code) => {
    codePlaceholders.push(`<code>${escapeHtml(code)}</code>`);
    return `@@CODE_${codePlaceholders.length - 1}@@`;
  });

  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label, url) => `<a href="${escapeHtml(url)}" rel="noreferrer" target="_blank">${label}</a>`,
  );
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  codePlaceholders.forEach((placeholder, index) => {
    text = text.replace(`@@CODE_${index}@@`, placeholder);
  });

  return text;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
