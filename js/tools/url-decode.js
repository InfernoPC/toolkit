export default {
  id: 'url-decode',
  title: 'URL Decode',
  mode: 'input',
  compute(raw) {
    const escapes = raw.match(/%[0-9A-Fa-f]{2}/g);
    if (!escapes) {
      return { valid: false, confidence: 0.05, note: '沒有偵測到 %XX 編碼字元' };
    }
    try {
      const decoded = decodeURIComponent(raw);
      const confidence = Math.min(0.9, 0.5 + escapes.length * 0.05);
      return { valid: true, confidence, sections: [{ rows: [{ value: decoded }] }] };
    } catch (e) {
      return { valid: false, confidence: 0.15, note: '含有 %XX 樣式，但不是合法的 URL 編碼序列' };
    }
  },
};
