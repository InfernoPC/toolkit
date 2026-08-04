export default {
  id: 'json-format',
  title: 'JSON Formatter',
  mode: 'input',
  compute(raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return { valid: false, confidence: 0, note: 'JSON 解析失敗：' + e.message };
    }
    const isObjectLike = typeof parsed === 'object' && parsed !== null;
    return {
      valid: true,
      confidence: isObjectLike ? 0.95 : 0.5,
      sections: [{ rows: [{ value: JSON.stringify(parsed, null, 2) }] }],
    };
  },
};
