function tokenize(expr) {
  const clean = expr.replace(/\s+/g, '');
  const tokens = clean.match(/\d+\.\d+|\.\d+|\d+|[+\-*/()]/g) || [];
  if (tokens.join('') !== clean) {
    throw new Error('包含無法辨識的字元');
  }
  return tokens;
}

function evaluate(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseValue() {
    const tok = peek();
    if (tok === '(') {
      consume();
      const val = parseAddSub();
      if (consume() !== ')') throw new Error('括號不成對');
      return val;
    }
    if (tok === '-') {
      consume();
      return -parseValue();
    }
    if (tok === '+') {
      consume();
      return parseValue();
    }
    if (tok === undefined || Number.isNaN(Number(tok))) throw new Error('語法錯誤');
    consume();
    return Number(tok);
  }

  function parseMulDiv() {
    let val = parseValue();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const rhs = parseValue();
      if (op === '*') {
        val *= rhs;
      } else {
        if (rhs === 0) throw new Error('除以零');
        val /= rhs;
      }
    }
    return val;
  }

  function parseAddSub() {
    let val = parseMulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const rhs = parseMulDiv();
      val = op === '+' ? val + rhs : val - rhs;
    }
    return val;
  }

  const result = parseAddSub();
  if (pos !== tokens.length) throw new Error('語法錯誤（多餘的字元）');
  return result;
}

export default {
  id: 'calculator',
  title: '計算機',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    if (!/^[0-9+\-*/(). \t]+$/.test(trimmed)) {
      return { valid: false, confidence: 0, note: '不是簡單的數學算式（僅支援數字、+ - * / 與括號）' };
    }
    if (!/[+\-*/]/.test(trimmed)) {
      return { valid: false, confidence: 0, note: '請輸入包含 + - * / 的算式' };
    }
    try {
      const result = evaluate(tokenize(trimmed));
      if (!Number.isFinite(result)) {
        return { valid: false, confidence: 0.2, note: '計算結果非有限數值' };
      }
      return {
        valid: true,
        confidence: 0.6,
        sections: [{ rows: [{ value: String(result) }] }],
      };
    } catch (e) {
      return { valid: false, confidence: 0.1, note: '算式語法錯誤：' + e.message };
    }
  },
};
