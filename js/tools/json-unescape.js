const MAX_LAYERS = 4;

export default {
  id: 'json-unescape',
  title: 'JSON Un-escape',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    if (!/\\"/.test(trimmed)) {
      return { valid: false, confidence: 0, note: '沒有偵測到 \\" 這種跳脫字元' };
    }

    let current = trimmed;
    let layers = 0;

    for (let i = 0; i < MAX_LAYERS; i += 1) {
      let unescaped;
      try {
        unescaped = JSON.parse('"' + current + '"');
      } catch (e) {
        break;
      }
      layers += 1;
      current = unescaped;

      try {
        const parsed = JSON.parse(current);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            valid: true,
            confidence: 0.85,
            sections: [
              {
                label: layers > 1 ? `已還原 ${layers} 層跳脫` : '已還原跳脫',
                rows: [{ value: JSON.stringify(parsed, null, 2) }],
              },
            ],
          };
        }
      } catch (e) {
        // not valid JSON yet — maybe another layer of escaping remains, keep looping
      }
    }

    return {
      valid: false,
      confidence: 0.1,
      note: '偵測到跳脫字元，但還原後仍不是合法的 JSON',
    };
  },
};
