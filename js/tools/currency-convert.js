const API_URL = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = 'toolkit-fx-rates-v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // rates only refresh daily upstream; 6h keeps us well within that

const TARGET_CODES = ['TWD', 'USD', 'JPY', 'EUR', 'CNY', 'HKD', 'GBP', 'KRW', 'AUD', 'SGD'];

const CODE_ALIASES = {
  NTD: 'TWD',
  RMB: 'CNY',
};

const SYMBOL_CODES = {
  'NT$': 'TWD',
  'HK$': 'HKD',
  'US$': 'USD',
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₩': 'KRW',
  '₹': 'INR',
};

const ZERO_DECIMAL_CODES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

const NUM_RE = '[+-]?\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?|[+-]?\\d+(?:\\.\\d+)?';

function normalizeCode(code) {
  const upper = code.toUpperCase();
  return CODE_ALIASES[upper] || upper;
}

function parseInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let m = new RegExp(`^(${NUM_RE})\\s*([a-zA-Z]{3})$`).exec(trimmed);
  if (m) return { amount: m[1], code: normalizeCode(m[2]) };

  m = new RegExp(`^([a-zA-Z]{3})\\s*(${NUM_RE})$`).exec(trimmed);
  if (m) return { amount: m[2], code: normalizeCode(m[1]) };

  const symbolPattern = Object.keys(SYMBOL_CODES)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  m = new RegExp(`^(${symbolPattern})\\s*(${NUM_RE})$`, 'i').exec(trimmed);
  if (m) {
    const key = Object.keys(SYMBOL_CODES).find((s) => s.toUpperCase() === m[1].toUpperCase());
    return { amount: m[2], code: SYMBOL_CODES[key] };
  }

  return null;
}

function loadCachedRates() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveCachedRates(record) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(record));
  } catch (e) {
    // storage full or unavailable; live rates just won't be cached for next load
  }
}

let ratesPromise = null;

async function fetchRates() {
  const cached = loadCachedRates();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.result !== 'success' || !data.rates) throw new Error('無效的回應內容');
    const record = { rates: data.rates, updatedAt: data.time_last_update_utc, fetchedAt: Date.now() };
    saveCachedRates(record);
    return record;
  } catch (e) {
    if (cached) return { ...cached, stale: true };
    throw e;
  }
}

function getRates() {
  if (!ratesPromise) {
    ratesPromise = fetchRates().catch((e) => {
      ratesPromise = null; // allow a retry on the next lookup instead of caching the failure
      throw e;
    });
  }
  return ratesPromise;
}

// Warm the cache as soon as the app loads so the first real lookup doesn't stall on the network.
getRates().catch(() => {});

function formatAmount(value, code) {
  const digits = ZERO_DECIMAL_CODES.has(code) ? 0 : 2;
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default {
  id: 'currency-convert',
  title: '匯率換算',
  mode: 'input',
  async compute(raw) {
    const parsed = parseInput(raw);
    if (!parsed) {
      return {
        valid: false,
        confidence: 0,
        note: '格式需為「金額 貨幣代碼」，例如：1234 jpy、100 usd、¥1234、NT$500',
      };
    }

    const amount = Number(parsed.amount.replace(/,/g, ''));
    if (!Number.isFinite(amount)) {
      return { valid: false, confidence: 0, note: '金額無法辨識' };
    }

    let data;
    try {
      data = await getRates();
    } catch (e) {
      return { valid: false, confidence: 0.3, note: '無法取得匯率資料，請檢查網路連線後再試一次' };
    }

    const { code } = parsed;
    const rate = data.rates[code];
    if (!rate) {
      return { valid: false, confidence: 0.2, note: `不支援的貨幣代碼：${code}` };
    }

    const usdAmount = amount / rate;
    const targets = TARGET_CODES.filter((c) => c !== code && data.rates[c]);

    return {
      valid: true,
      confidence: 0.75,
      sections: [
        {
          label: `${formatAmount(amount, code)} ${code} =`,
          rows: targets.map((c) => ({ label: c, value: formatAmount(usdAmount * data.rates[c], c) })),
        },
        {
          rows: [
            {
              value:
                `匯率時間：${data.updatedAt}` +
                (data.stale ? '（離線，使用快取匯率，可能非最新）' : '') +
                ' · 來源：exchangerate-api.com',
            },
          ],
        },
      ],
    };
  },
};
