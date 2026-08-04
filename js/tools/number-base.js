export default {
  id: 'number-base',
  title: '進位制轉換',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    let value = null;
    let confidence = 0;

    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      value = BigInt(trimmed);
      confidence = 0.85;
    } else if (/^0b[01]+$/.test(trimmed)) {
      value = BigInt(trimmed);
      confidence = 0.85;
    } else if (/^0o[0-7]+$/.test(trimmed)) {
      value = BigInt(trimmed);
      confidence = 0.85;
    } else if (/^-?\d+$/.test(trimmed)) {
      value = BigInt(trimmed);
      confidence = 0.4;
    }

    if (value === null) {
      return { valid: false, confidence: 0, note: '不是可辨識的整數（支援 10 / 0x / 0b / 0o 進位）' };
    }

    const abs = value < 0n ? -value : value;
    const sign = value < 0n ? '-' : '';

    return {
      valid: true,
      confidence,
      sections: [
        {
          rows: [
            { label: 'BIN', value: sign + '0b' + abs.toString(2) },
            { label: 'OCT', value: sign + '0o' + abs.toString(8) },
            { label: 'DEC', value: value.toString(10) },
            { label: 'HEX', value: sign + '0x' + abs.toString(16) },
          ],
        },
      ],
    };
  },
};
