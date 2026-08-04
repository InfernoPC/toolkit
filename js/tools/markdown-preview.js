function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(url) {
  if (/^(https?:|mailto:)/i.test(url) || /^[^:]*$/.test(url)) return url;
  return '#';
}

function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (m, a, b) => `<strong>${a || b}</strong>`);
  out = out.replace(/\*([^*]+)\*|_([^_]+)_/g, (m, a, b) => `<em>${a || b}</em>`);
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, url) => `<img alt="${alt}" src="${safeUrl(url)}">`);
  out = out.replace(
    /\[([^\]]*)\]\(([^)]+)\)/g,
    (m, txt, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${txt}</a>`
  );
  return out;
}

function renderMarkdown(raw) {
  const lines = raw.split('\n');
  let html = '';
  let i = 0;
  let inCodeBlock = false;
  let codeBuffer = [];
  let listBuffer = [];
  let listType = null;

  function flushList() {
    if (listBuffer.length) {
      html += `<${listType}>${listBuffer.map((item) => `<li>${renderInline(item)}</li>`).join('')}</${listType}>`;
      listBuffer = [];
      listType = null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      if (!inCodeBlock) {
        flushList();
        inCodeBlock = true;
        codeBuffer = [];
      } else {
        html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
        inCodeBlock = false;
      }
      i += 1;
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      i += 1;
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushList();
      i += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      html += `<h${level}>${renderInline(headingMatch[2])}</h${level}>`;
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushList();
      html += '<hr>';
      i += 1;
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/.exec(line);
    if (quoteMatch) {
      flushList();
      html += `<blockquote>${renderInline(quoteMatch[1])}</blockquote>`;
      i += 1;
      continue;
    }

    const ulMatch = /^[-*+]\s+(.*)$/.exec(line);
    if (ulMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listBuffer.push(ulMatch[1]);
      i += 1;
      continue;
    }

    const olMatch = /^\d+\.\s+(.*)$/.exec(line);
    if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listBuffer.push(olMatch[1]);
      i += 1;
      continue;
    }

    flushList();
    html += `<p>${renderInline(line)}</p>`;
    i += 1;
  }

  flushList();
  if (inCodeBlock) {
    html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
  }
  return html;
}

const SYNTAX_HINT = /(^|\n)\s{0,3}#{1,6}\s|\*\*[^*]+\*\*|__[^_]+__|```|\[[^\]]*\]\([^)]+\)|(^|\n)\s{0,3}[-*+]\s|(^|\n)\s{0,3}\d+\.\s|(^|\n)>\s?/;

export default {
  id: 'markdown-preview',
  title: 'Markdown 預覽',
  mode: 'input',
  compute(raw) {
    if (!SYNTAX_HINT.test(raw)) {
      return { valid: false, confidence: 0, note: '沒有偵測到 Markdown 語法（標題、粗體、清單、連結等）' };
    }

    const html = renderMarkdown(raw);
    return {
      valid: true,
      confidence: 0.5,
      sections: [
        { label: '預覽', rows: [{ type: 'html', value: html }] },
        { label: 'HTML 原始碼', rows: [{ value: html }] },
      ],
    };
  },
};
