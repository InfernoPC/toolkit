import base64Encode from './tools/base64-encode.js';
import base64Decode from './tools/base64-decode.js';
import urlEncode from './tools/url-encode.js';
import urlDecode from './tools/url-decode.js';
import hash from './tools/hash.js';
import jsonFormat from './tools/json-format.js';
import jsonUnescape from './tools/json-unescape.js';
import jwtDecode from './tools/jwt-decode.js';
import unixTimestamp from './tools/unix-timestamp.js';
import numberBase from './tools/number-base.js';
import colorConvert from './tools/color-convert.js';
import htmlEntity from './tools/html-entity.js';
import caseConvert from './tools/case-convert.js';
import qrCode from './tools/qr-code.js';
import imageBase64 from './tools/image-base64.js';
import calculator from './tools/calculator.js';
import textStats from './tools/text-stats.js';
import cron from './tools/cron.js';
import ipCidr from './tools/ip-cidr.js';
import markdownPreview from './tools/markdown-preview.js';
import passwordGenerator from './tools/password-generator.js';
import uuidGenerator from './tools/uuid-generator.js';
import loremIpsum from './tools/lorem-ipsum.js';
import randomColor from './tools/random-color.js';
import currencyConvert from './tools/currency-convert.js';
import EXAMPLES from './examples.js';

const INPUT_TOOLS = [
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  hash,
  jsonFormat,
  jsonUnescape,
  jwtDecode,
  unixTimestamp,
  numberBase,
  colorConvert,
  htmlEntity,
  caseConvert,
  qrCode,
  imageBase64,
  calculator,
  textStats,
  cron,
  ipCidr,
  markdownPreview,
  passwordGenerator,
  currencyConvert,
];

const GENERATOR_TOOLS = [uuidGenerator, loremIpsum, randomColor];

const EMPTY_RESULT = { valid: false, confidence: 0, note: '尚未輸入內容', sections: [] };

const gridInput = document.getElementById('grid-input');
const gridGenerator = document.getElementById('grid-generator');
const sharedInput = document.getElementById('shared-input');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = '已複製';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1200);
  } catch (e) {
    btn.textContent = '複製失敗';
  }
}

function buildOutputRow(row) {
  const r = el('div', 'output-row');

  if (row.label) {
    r.appendChild(el('span', 'output-label', row.label));
  }

  if (row.type === 'image') {
    const wrap = el('div', `output-value ${row.previewClass || 'qr-canvas-wrap'}`);
    const img = document.createElement('img');
    img.src = row.value;
    img.alt = row.alt || 'preview';
    wrap.appendChild(img);
    r.appendChild(wrap);

    const linksWrap = el('div', 'image-download-links');
    const buildDownloadLink = (value, filename) => {
      const ext = (filename || 'output.png').split('.').pop().toUpperCase();
      const link = document.createElement('a');
      link.className = 'copy-btn';
      link.textContent = `下載 ${ext}`;
      link.href = value;
      link.download = filename || 'output.png';
      return link;
    };

    linksWrap.appendChild(buildDownloadLink(row.value, row.filename));
    (row.extraDownloads || []).forEach((d) => {
      linksWrap.appendChild(buildDownloadLink(d.value, d.filename));
    });
    r.appendChild(linksWrap);
    return r;
  }

  if (row.type === 'html') {
    const wrap = el('div', 'output-value markdown-preview');
    wrap.innerHTML = row.value;
    r.appendChild(wrap);
    return r;
  }

  const valueEl = el('div', 'output-value');
  if (row.swatch) {
    const swatch = el('span', 'color-swatch');
    swatch.style.background = row.swatch;
    valueEl.appendChild(swatch);
  }
  valueEl.appendChild(document.createTextNode(row.value));
  r.appendChild(valueEl);

  const btn = el('button', 'copy-btn', '複製');
  btn.type = 'button';
  btn.addEventListener('click', () => copyText(row.value, btn));
  r.appendChild(btn);

  return r;
}

function renderSections(container, result) {
  container.innerHTML = '';

  if (!result.valid) {
    if (result.note) container.appendChild(el('div', 'invalid-note', result.note));
    return;
  }

  (result.sections || []).forEach((section) => {
    const wrap = el('div', 'subgroup');
    if (section.label) wrap.appendChild(el('div', 'subgroup-label', section.label));
    (section.rows || []).forEach((row) => wrap.appendChild(buildOutputRow(row)));
    container.appendChild(wrap);
  });
}

function confidenceHue(confidence) {
  return Math.max(0, Math.min(1, confidence ?? 0)) * 130; // 0 = red, 130 = green
}

function renderResult(card, result) {
  card.lastResult = result;
  card.el.classList.toggle('invalid', !result.valid);

  if (card.badge) {
    if (result.valid) {
      const hue = confidenceHue(result.confidence);
      card.badge.textContent = `${Math.round((result.confidence ?? 0) * 100)}%`;
      card.badge.style.color = `hsl(${hue}, 65%, 38%)`;
      card.badge.style.borderColor = `hsl(${hue}, 65%, 45%)`;
      card.badge.style.background = `hsla(${hue}, 65%, 50%, 0.16)`;
    } else {
      card.badge.textContent = '不符合';
      card.badge.style.color = '';
      card.badge.style.borderColor = '';
      card.badge.style.background = '';
    }
  }

  renderSections(card.body, result);

  if (expandedCard === card) {
    renderSections(expandBody, result);
  }
}

function buildCardShell(tool, { withBadge }) {
  const cardEl = el('div', 'tool-card');
  cardEl.dataset.toolId = tool.id;

  const titleRow = el('div', 'card-title-row');
  titleRow.appendChild(el('span', 'card-title', tool.title));

  const actions = el('div', 'card-actions');
  titleRow.appendChild(actions);

  let badge = null;
  if (withBadge) {
    badge = el('span', 'confidence-badge');
    actions.appendChild(badge);
  }

  const body = el('div', 'card-body');
  cardEl.appendChild(titleRow);
  cardEl.appendChild(body);

  const card = { el: cardEl, titleRow, actions, body, badge, lastResult: null };

  const expandBtn = el('button', 'expand-btn', '🔍');
  expandBtn.type = 'button';
  expandBtn.title = '放大檢視';
  expandBtn.addEventListener('click', () => {
    if (card.lastResult) openExpand(card, tool.title);
  });
  actions.appendChild(expandBtn);

  return card;
}

function addTitleButton(card, className, label, onClick) {
  const btn = el('button', className, label);
  btn.type = 'button';
  btn.addEventListener('click', onClick);
  card.actions.appendChild(btn);
  return btn;
}

function safeCompute(tool, raw) {
  try {
    return Promise.resolve(tool.compute(raw));
  } catch (e) {
    return Promise.resolve({ valid: false, confidence: 0, note: '發生錯誤：' + e.message, sections: [] });
  }
}

let lastRaw = '';

// Expand-to-lightbox overlay, shared by every card. Its z-index stays below the
// sticky input bar's, so the input box always stays visible/usable on top of it.
const expandOverlay = document.getElementById('expand-overlay');
const expandTitle = document.getElementById('expand-title');
const expandBody = document.getElementById('expand-body');
const expandCloseBtn = document.getElementById('expand-close');
let expandedCard = null;

function openExpand(card, title) {
  expandedCard = card;
  expandTitle.textContent = title;
  renderSections(expandBody, card.lastResult);
  expandOverlay.classList.remove('hidden');
}

function closeExpand() {
  expandedCard = null;
  expandOverlay.classList.add('hidden');
}

expandCloseBtn.addEventListener('click', closeExpand);
expandOverlay.addEventListener('click', (e) => {
  if (e.target === expandOverlay) closeExpand();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !expandOverlay.classList.contains('hidden')) closeExpand();
});

// Input examples overlay
const examplesToggle = document.getElementById('examples-toggle');
const examplesOverlay = document.getElementById('examples-overlay');
const examplesClose = document.getElementById('examples-close');
const examplesList = document.getElementById('examples-list');

function openExamples() {
  examplesList.innerHTML = '';
  INPUT_TOOLS.forEach((tool) => {
    const samples = EXAMPLES[tool.id];
    if (!samples || samples.length === 0) return;

    const group = el('div', 'examples-group');
    group.appendChild(el('div', 'examples-group-title', tool.title));

    const chips = el('div', 'examples-chips');
    samples.forEach((sample) => {
      const chip = el('button', 'example-chip', sample);
      chip.type = 'button';
      chip.title = sample;
      chip.addEventListener('click', () => {
        sharedInput.value = sample;
        closeExamples();
        sharedInput.focus();
        updateAll();
      });
      chips.appendChild(chip);
    });
    group.appendChild(chips);
    examplesList.appendChild(group);
  });
  examplesOverlay.classList.remove('hidden');
}

function closeExamples() {
  examplesOverlay.classList.add('hidden');
}

examplesToggle.addEventListener('click', openExamples);
examplesClose.addEventListener('click', closeExamples);
examplesOverlay.addEventListener('click', (e) => {
  if (e.target === examplesOverlay) closeExamples();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !examplesOverlay.classList.contains('hidden')) closeExamples();
});

const inputCards = new Map();
INPUT_TOOLS.forEach((tool) => {
  const card = buildCardShell(tool, { withBadge: true });
  gridInput.appendChild(card.el);
  inputCards.set(tool.id, card);

  if (tool.regenerable) {
    addTitleButton(card, 'regen-btn', '🔀 重新產生', () => {
      safeCompute(tool, lastRaw).then((result) => renderResult(card, result));
    });
  }
});

// Non-text input widgets that live beside the shared textarea
const inputToolsPanel = document.getElementById('input-tools');
const calcPad = document.getElementById('calc-pad');

if ('EyeDropper' in window) {
  const btn = el('button', 'icon-btn', '🎨');
  btn.type = 'button';
  btn.title = '從螢幕選色';
  btn.addEventListener('click', async () => {
    try {
      const picker = new window.EyeDropper();
      const result = await picker.open();
      sharedInput.value = result.sRGBHex;
      updateAll();
    } catch (e) {
      // user cancelled the picker; nothing to do
    }
  });
  inputToolsPanel.appendChild(btn);
}

const calcToggleBtn = el('button', 'icon-btn', '🧮');
calcToggleBtn.type = 'button';
calcToggleBtn.title = '算式小鍵盤';
calcToggleBtn.addEventListener('click', () => {
  calcPad.classList.toggle('hidden');
});
inputToolsPanel.appendChild(calcToggleBtn);

function insertAtCursor(text) {
  const start = sharedInput.selectionStart ?? sharedInput.value.length;
  const end = sharedInput.selectionEnd ?? sharedInput.value.length;
  const value = sharedInput.value;
  sharedInput.value = value.slice(0, start) + text + value.slice(end);
  const newPos = start + text.length;
  sharedInput.focus();
  sharedInput.setSelectionRange(newPos, newPos);
  updateAll();
}

function deleteAtCursor() {
  const start = sharedInput.selectionStart ?? sharedInput.value.length;
  const end = sharedInput.selectionEnd ?? sharedInput.value.length;
  const value = sharedInput.value;
  if (start === end && start > 0) {
    sharedInput.value = value.slice(0, start - 1) + value.slice(end);
    sharedInput.focus();
    sharedInput.setSelectionRange(start - 1, start - 1);
  } else {
    sharedInput.value = value.slice(0, start) + value.slice(end);
    sharedInput.focus();
    sharedInput.setSelectionRange(start, start);
  }
  updateAll();
}

calcPad.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.insert !== undefined) {
      insertAtCursor(btn.dataset.insert);
    } else if (btn.dataset.action === 'clear') {
      sharedInput.value = '';
      sharedInput.focus();
      updateAll();
    } else if (btn.dataset.action === 'backspace') {
      deleteAtCursor();
    }
  });
});

const generatorCards = new Map();
GENERATOR_TOOLS.forEach((tool) => {
  const card = buildCardShell(tool, { withBadge: false });
  gridGenerator.appendChild(card.el);
  generatorCards.set(tool.id, card);
  addTitleButton(card, 'regen-btn', '🔀 重新產生', () => runGenerator(tool, card));
});

function runGenerator(tool, card) {
  safeCompute(tool, '').then((result) => renderResult(card, result));
}

GENERATOR_TOOLS.forEach((tool) => runGenerator(tool, generatorCards.get(tool.id)));

let updateToken = 0;
async function updateAll() {
  const token = ++updateToken;
  const raw = sharedInput.value;
  lastRaw = raw;

  const entries =
    raw.length === 0
      ? INPUT_TOOLS.map((tool) => ({ tool, result: EMPTY_RESULT }))
      : await Promise.all(
          INPUT_TOOLS.map(async (tool) => ({ tool, result: await safeCompute(tool, raw) }))
        );

  if (token !== updateToken) return; // a newer input event superseded this one

  entries.forEach(({ tool, result }) => renderResult(inputCards.get(tool.id), result));

  entries.sort((a, b) => {
    if (a.result.valid !== b.result.valid) return a.result.valid ? -1 : 1;
    return (b.result.confidence ?? 0) - (a.result.confidence ?? 0);
  });

  entries.forEach(({ tool }, idx) => {
    inputCards.get(tool.id).el.style.order = String(idx);
  });
}

const scheduleUpdate = (() => {
  let timer = null;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(updateAll, 120);
  };
})();

sharedInput.addEventListener('input', scheduleUpdate);

sharedInput.addEventListener('paste', (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;

  const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
  if (!imageItem) return;

  const file = imageItem.getAsFile();
  if (!file) return;

  e.preventDefault();
  const reader = new FileReader();
  reader.onload = () => {
    sharedInput.value = reader.result;
    updateAll();
  };
  reader.readAsDataURL(file);
});

updateAll();

// Theme handling
const themeToggle = document.getElementById('theme-toggle');
const THEME_KEY = 'toolkit-theme';

function applyTheme(theme) {
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

applyTheme(localStorage.getItem(THEME_KEY));

themeToggle.addEventListener('click', () => {
  const current =
    document.documentElement.getAttribute('data-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});
