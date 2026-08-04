const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = LOWER.toUpperCase();
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}';

function randomChar(pool) {
  const idx = crypto.getRandomValues(new Uint32Array(1))[0] % pool.length;
  return pool[idx];
}

function generate(length, withSymbols) {
  const pool = LOWER + UPPER + DIGITS + (withSymbols ? SYMBOLS : '');
  let out = '';
  for (let i = 0; i < length; i += 1) out += randomChar(pool);
  return out;
}

export default {
  id: 'password-generator',
  title: '隨機密碼產生器',
  mode: 'input',
  regenerable: true,
  compute(raw) {
    const trimmed = raw.trim();
    if (!/^\d{1,2}$/.test(trimmed)) {
      return { valid: false, confidence: 0, note: '輸入 1~50 的數字，依該長度產生密碼' };
    }
    const length = Number(trimmed);
    if (length < 1 || length > 50) {
      return { valid: false, confidence: 0, note: '長度需介於 1~50 之間' };
    }
    return {
      valid: true,
      confidence: 0.4,
      sections: [
        {
          label: `${length} 碼`,
          rows: [
            { label: '含符號', value: generate(length, true) },
            { label: '不含符號', value: generate(length, false) },
          ],
        },
      ],
    };
  },
};
