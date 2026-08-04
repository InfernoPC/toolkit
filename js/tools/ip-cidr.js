function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function ipToInt(octets) {
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

function toBinaryOctets(octets) {
  return octets.map((o) => o.toString(2).padStart(8, '0')).join('.');
}

export default {
  id: 'ip-cidr',
  title: 'IP / CIDR 計算機',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/.exec(trimmed);
    if (!match) {
      return { valid: false, confidence: 0, note: '不是合法的 IPv4 位址（例如 192.168.1.10/24）' };
    }

    const octets = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])];
    if (octets.some((o) => o > 255)) {
      return { valid: false, confidence: 0, note: '每個位元組必須介於 0~255' };
    }

    const hasPrefix = match[5] !== undefined;
    const prefix = hasPrefix ? Number(match[5]) : 32;
    if (prefix > 32) {
      return { valid: false, confidence: 0, note: 'CIDR 前綴需介於 0~32' };
    }

    const ipInt = ipToInt(octets);

    if (!hasPrefix) {
      return {
        valid: true,
        confidence: 0.6,
        sections: [
          {
            rows: [
              { label: 'IP', value: intToIp(ipInt) },
              { label: '二進位', value: toBinaryOctets(octets) },
              { value: '未提供 CIDR 前綴，視為單一位址 (/32)' },
            ],
          },
        ],
      };
    }

    const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const wildcardInt = ~maskInt >>> 0;
    const networkInt = ipInt & maskInt;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;

    let firstUsable;
    let lastUsable;
    let hostCount;
    if (prefix >= 31) {
      firstUsable = networkInt;
      lastUsable = broadcastInt;
      hostCount = prefix === 32 ? 1 : 2;
    } else {
      firstUsable = networkInt + 1;
      lastUsable = broadcastInt - 1;
      hostCount = 2 ** (32 - prefix) - 2;
    }

    return {
      valid: true,
      confidence: 0.85,
      sections: [
        {
          rows: [
            { label: '網路位址', value: `${intToIp(networkInt)}/${prefix}` },
            { label: '廣播位址', value: intToIp(broadcastInt) },
            { label: '子網路遮罩', value: intToIp(maskInt) },
            { label: '反遮罩', value: intToIp(wildcardInt) },
            { label: '可用範圍', value: `${intToIp(firstUsable)} ~ ${intToIp(lastUsable)}` },
            { label: '可用主機數', value: String(hostCount) },
            { label: '二進位', value: toBinaryOctets(octets) },
          ],
        },
      ],
    };
  },
};
