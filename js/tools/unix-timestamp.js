function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export default {
  id: 'unix-timestamp',
  title: 'Unix Timestamp ⇄ 日期',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    const sections = [];
    let bestConfidence = 0;

    if (/^-?\d{9,13}$/.test(trimmed)) {
      const num = Number(trimmed);
      const ms = trimmed.replace('-', '').length >= 12 ? num : num * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) {
        bestConfidence = Math.max(bestConfidence, 0.75);
        sections.push({
          label: 'Timestamp → 日期',
          rows: [
            { label: '本地時間', value: formatDate(d) },
            { label: 'UTC', value: d.toISOString() },
          ],
        });
      }
    }

    if (!/^-?\d+$/.test(trimmed) && trimmed.length >= 6) {
      const parsed = Date.parse(trimmed);
      if (!isNaN(parsed)) {
        bestConfidence = Math.max(bestConfidence, 0.7);
        sections.push({
          label: '日期字串 → Timestamp',
          rows: [
            { label: '秒', value: String(Math.floor(parsed / 1000)) },
            { label: '毫秒', value: String(parsed) },
          ],
        });
      }
    }

    if (sections.length === 0) {
      return { valid: false, confidence: 0, note: '不是可辨識的 Unix timestamp 或日期字串' };
    }
    return { valid: true, confidence: bestConfidence, sections };
  },
};
