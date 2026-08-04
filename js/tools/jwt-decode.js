import { base64UrlToBase64 } from './_shared.js';

function decodeSegment(seg) {
  const b64 = base64UrlToBase64(seg);
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export default {
  id: 'jwt-decode',
  title: 'JWT Decode',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    const parts = trimmed.split('.');
    if (parts.length !== 3 || parts.some((p) => p.length === 0)) {
      return { valid: false, confidence: 0, note: '不是 header.payload.signature 三段式 JWT 格式' };
    }
    try {
      const header = JSON.stringify(JSON.parse(decodeSegment(parts[0])), null, 2);
      const payload = JSON.stringify(JSON.parse(decodeSegment(parts[1])), null, 2);
      return {
        valid: true,
        confidence: 0.95,
        sections: [
          { label: 'Header', rows: [{ value: header }] },
          { label: 'Payload', rows: [{ value: payload }] },
          { label: 'Signature（未驗證）', rows: [{ value: parts[2] }] },
        ],
      };
    } catch (e) {
      return { valid: false, confidence: 0.1, note: '格式類似 JWT，但 header/payload 無法解碼為 JSON' };
    }
  },
};
