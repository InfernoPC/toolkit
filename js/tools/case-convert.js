function toTitleCase(lowerWords) {
  return lowerWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function splitWords(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export default {
  id: 'case-convert',
  title: '大小寫 / 命名風格轉換',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { valid: false, confidence: 0, note: '沒有可轉換的文字' };
    }
    const words = splitWords(trimmed);
    const lower = words.map((w) => w.toLowerCase());

    return {
      valid: true,
      confidence: 0.15,
      sections: [
        {
          rows: [
            { label: 'UPPER', value: trimmed.toUpperCase() },
            { label: 'lower', value: trimmed.toLowerCase() },
            { label: 'Title Case', value: toTitleCase(lower) },
            {
              label: 'camelCase',
              value: lower.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(''),
            },
            {
              label: 'PascalCase',
              value: lower.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
            },
            { label: 'snake_case', value: lower.join('_') },
            { label: 'kebab-case', value: lower.join('-') },
          ],
        },
      ],
    };
  },
};
