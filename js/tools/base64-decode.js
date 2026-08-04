import { base64ToUtf8, isLikelyBase64 } from './_shared.js';

export default {
  id: 'base64-decode',
  title: 'Base64 Decode',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    if (!isLikelyBase64(trimmed)) {
      return { valid: false, confidence: 0, note: '不是合法的 Base64 字串（字元集或長度不符）' };
    }
    try {
      const text = base64ToUtf8(trimmed);
      return {
        valid: true,
        confidence: 0.85,
        sections: [{ rows: [{ value: text }] }],
      };
    } catch (e) {
      return {
        valid: false,
        confidence: 0.15,
        note: '符合 Base64 字元集，但解碼後不是有效的 UTF-8 文字（可能是二進位資料）',
      };
    }
  },
};
