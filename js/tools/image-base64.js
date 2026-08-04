const MAGIC_SIGNATURES = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

function detectMime(bytes) {
  for (const sig of MAGIC_SIGNATURES) {
    const matches = sig.bytes.every((b, i) => bytes[i] === b);
    if (!matches) continue;
    if (sig.mime === 'image/webp') {
      const tag = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (tag !== 'WEBP') continue;
    }
    return sig.mime;
  }
  return null;
}

export default {
  id: 'image-base64',
  title: '圖片 ⇄ Base64',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { valid: false, confidence: 0, note: '尚未輸入內容（可直接貼上圖片，或貼上圖片的 Base64）' };
    }

    const dataUrlMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(trimmed);
    let mime = null;
    let payload = null;

    if (dataUrlMatch) {
      mime = dataUrlMatch[1];
      payload = dataUrlMatch[2].replace(/\s+/g, '');
    } else {
      const clean = trimmed.replace(/\s+/g, '');
      if (/^[A-Za-z0-9+/]+={0,2}$/.test(clean) && clean.length % 4 === 0) {
        payload = clean;
      }
    }

    if (!payload) {
      return { valid: false, confidence: 0, note: '不是合法的 Base64 或圖片 Data URL' };
    }

    let bytes;
    try {
      bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
    } catch (e) {
      return { valid: false, confidence: 0.1, note: 'Base64 格式不正確，無法解碼' };
    }

    if (!mime) mime = detectMime(bytes);
    if (!mime) {
      return {
        valid: false,
        confidence: 0.15,
        note: '解碼成功，但看不出是常見的圖片格式（PNG / JPEG / GIF / WebP）',
      };
    }

    const dataUrl = `data:${mime};base64,${payload}`;
    const ext = mime.split('/')[1].split('+')[0];
    const sizeKb = (bytes.length / 1024).toFixed(1);

    return {
      valid: true,
      confidence: dataUrlMatch ? 0.95 : 0.8,
      sections: [
        {
          rows: [
            { type: 'image', value: dataUrl, filename: `image.${ext}`, previewClass: 'photo-preview-wrap', alt: '圖片預覽' },
            { label: `Base64 (${sizeKb} KB)`, value: dataUrl },
          ],
        },
      ],
    };
  },
};
