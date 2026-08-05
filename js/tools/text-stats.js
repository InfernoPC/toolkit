// CJK Unified Ideographs, Ext-A, Compatibility Ideographs, Hiragana/Katakana, Hangul Syllables.
// Built from numeric code points (not literal glyphs or \uXXXX escapes) so the source
// can't be silently corrupted by Unicode normalization when saved/edited by any tool.
const CJK_RANGES = [
  [0x4e00, 0x9fff],
  [0x3400, 0x4dbf],
  [0xf900, 0xfaff],
  [0x3040, 0x30ff],
  [0xac00, 0xd7af],
];

const CJK_REGEX = new RegExp(
  '[' + CJK_RANGES.map(([a, b]) => String.fromCharCode(a) + '-' + String.fromCharCode(b)).join('') + ']',
  'g'
);

function countWords(raw) {
  const cjkMatches = raw.match(CJK_REGEX) || [];
  const latinWords = raw
    .replace(CJK_REGEX, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return cjkMatches.length + latinWords.length;
}

export default {
  id: 'text-stats',
  title: '字數統計',
  mode: 'input',
  compute(raw) {
    const charCount = Array.from(raw).length;
    const charNoSpaceCount = Array.from(raw.replace(/\s/g, '')).length;
    const wordCount = countWords(raw);
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
            { label: '字數', value: String(wordCount) },
            { label: '行數', value: String(lineCount) },
            { label: 'Bytes (UTF-8)', value: String(byteCount) },
          ],
        },
      ],
    };
  },
};
