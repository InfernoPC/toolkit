const ENTITY_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function encode(str) {
  return str.replace(/[&<>"']/g, (c) => ENTITY_MAP[c]);
}

function decode(str) {
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}

export default {
  id: 'html-entity',
  title: 'HTML Entity',
  mode: 'input',
  compute(raw) {
    const hasEntity = /&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(raw);
    const sections = [{ label: 'Encode', rows: [{ value: encode(raw) }] }];
    let confidence = 0.2;
    if (hasEntity) {
      sections.push({ label: 'Decode', rows: [{ value: decode(raw) }] });
      confidence = 0.7;
    }
    return { valid: true, confidence, sections };
  },
};
