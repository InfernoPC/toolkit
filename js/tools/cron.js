const FIELD_RANGES = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'dom', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'dow', min: 0, max: 7 },
];

function parseField(field, min, max) {
  const allowed = new Set();
  field.split(',').forEach((part) => {
    let step = 1;
    let rangePart = part;
    if (part.includes('/')) {
      const [rp, s] = part.split('/');
      rangePart = rp;
      step = parseInt(s, 10);
      if (!Number.isFinite(step) || step <= 0) throw new Error('間隔數字無效');
    }

    let start;
    let end;
    if (rangePart === '*') {
      start = min;
      end = max;
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-').map(Number);
      if (Number.isNaN(a) || Number.isNaN(b)) throw new Error('範圍無效');
      start = a;
      end = b;
    } else {
      const n = Number(rangePart);
      if (Number.isNaN(n)) throw new Error('數字無效');
      start = n;
      end = part.includes('/') ? max : n;
    }

    if (start < min || end > max || start > end) throw new Error(`超出範圍 (${min}-${max})`);
    for (let v = start; v <= end; v += step) allowed.add(v);
  });
  return allowed;
}

function dayMatches(date, domSet, domWild, dowSet, dowWild) {
  const domMatch = domSet.has(date.getDate());
  const dowMatch = dowSet.has(date.getDay());
  if (domWild && dowWild) return true;
  if (domWild) return dowMatch;
  if (dowWild) return domMatch;
  return domMatch || dowMatch;
}

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

function describe(fields, sets) {
  const [minuteField, hourField, domField, monthField, dowField] = fields;
  const minuteIsSingle = sets.minute.size === 1;
  const hourIsSingle = sets.hour.size === 1;
  const hh = String([...sets.hour][0]).padStart(2, '0');
  const mm = String([...sets.minute][0]).padStart(2, '0');

  if (minuteIsSingle && hourIsSingle && domField === '*' && monthField === '*' && dowField === '*') {
    return `每天 ${hh}:${mm}`;
  }
  if (minuteIsSingle && hourIsSingle && domField === '*' && monthField === '*' && dowField !== '*') {
    const names = [...sets.dow].sort((a, b) => a - b).map((d) => `週${WEEKDAY_NAMES[d % 7]}`);
    return `每${names.join('、')} ${hh}:${mm}`;
  }
  if (minuteIsSingle && hourIsSingle && domField !== '*' && monthField === '*' && dowField === '*') {
    const days = [...sets.dom].sort((a, b) => a - b).join('、');
    return `每月 ${days} 號 ${hh}:${mm}`;
  }
  if (minuteField === '*' && hourField === '*') {
    return '每分鐘執行一次（在符合日期條件時）';
  }
  return `分鐘=${minuteField}　小時=${hourField}　日=${domField}　月=${monthField}　週=${dowField}`;
}

function nextRuns(sets, domWild, dowWild, count, maxDays) {
  const results = [];
  const sortedHours = [...sets.hour].sort((a, b) => a - b);
  const sortedMinutes = [...sets.minute].sort((a, b) => a - b);
  const now = new Date();
  const baseDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let d = 0; d < maxDays && results.length < count; d += 1) {
    const day = new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() + d);
    if (!sets.month.has(day.getMonth() + 1)) continue;
    if (!dayMatches(day, sets.dom, domWild, sets.dow, dowWild)) continue;

    for (let hi = 0; hi < sortedHours.length && results.length < count; hi += 1) {
      for (let mi = 0; mi < sortedMinutes.length && results.length < count; mi += 1) {
        const candidate = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          sortedHours[hi],
          sortedMinutes[mi],
          0,
          0
        );
        if (candidate.getTime() > now.getTime()) results.push(candidate);
      }
    }
  }
  return results;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export default {
  id: 'cron',
  title: 'Cron 運算式解讀',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    const fields = trimmed.split(/\s+/);
    if (fields.length !== 5) {
      return { valid: false, confidence: 0, note: 'Cron 格式需要 5 個以空白分隔的欄位（分 時 日 月 週）' };
    }
    if (!fields.every((f) => /^[\d*,\-/]+$/.test(f))) {
      return { valid: false, confidence: 0, note: '欄位包含不支援的字元（僅支援數字、* , - /）' };
    }

    let sets;
    try {
      sets = {
        minute: parseField(fields[0], FIELD_RANGES[0].min, FIELD_RANGES[0].max),
        hour: parseField(fields[1], FIELD_RANGES[1].min, FIELD_RANGES[1].max),
        dom: parseField(fields[2], FIELD_RANGES[2].min, FIELD_RANGES[2].max),
        month: parseField(fields[3], FIELD_RANGES[3].min, FIELD_RANGES[3].max),
        dow: parseField(fields[4], FIELD_RANGES[4].min, FIELD_RANGES[4].max),
      };
    } catch (e) {
      return { valid: false, confidence: 0.1, note: '欄位解析失敗：' + e.message };
    }

    // Normalize weekday 7 -> 0 (both mean Sunday)
    if (sets.dow.has(7)) {
      sets.dow.delete(7);
      sets.dow.add(0);
    }

    const domWild = fields[2] === '*';
    const dowWild = fields[4] === '*';
    const runs = nextRuns(sets, domWild, dowWild, 5, 4 * 366);

    const sections = [
      { label: '說明', rows: [{ value: describe(fields, sets) }] },
    ];

    if (runs.length > 0) {
      sections.push({
        label: '下幾次執行時間',
        rows: [{ value: runs.map(formatDate).join('\n') }],
      });
    } else {
      sections.push({
        label: '下幾次執行時間',
        rows: [{ value: '（在可搜尋的未來 4 年內找不到符合的時間）' }],
      });
    }

    return { valid: true, confidence: 0.75, sections };
  },
};
