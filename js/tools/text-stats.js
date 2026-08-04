export default {
  id: 'text-stats',
  title: '字數統計',
  mode: 'input',
  compute(raw) {
    const charCount = Array.from(raw).length;
    const charNoSpaceCount = Array.from(raw.replace(/\s/g, '')).length;
    const words = raw.trim().split(/\s+/).filter(Boolean);
    const lineCount = raw.length === 0 ? 0 : raw.split('\n').length;
    const byteCount = new TextEncoder().encode(raw).length;

    return {
      valid: true,
      confidence: 0.15,
      sections: [
        {
          rows: [
            { label: '字元數', value: String(charCount) },
            { label: '不含空白', value: String(charNoSpaceCount) },
            { label: '字數', value: String(words.length) },
            { label: '行數', value: String(lineCount) },
            { label: 'Bytes (UTF-8)', value: String(byteCount) },
          ],
        },
      ],
    };
  },
};
