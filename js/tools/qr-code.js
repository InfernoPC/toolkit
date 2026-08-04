import { utf8ToBase64 } from './_shared.js';

function buildCanvas(qr, cellSize, margin) {
  const count = qr.getModuleCount();
  const size = (count + margin * 2) * cellSize;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < count; c += 1) {
      if (qr.isDark(r, c)) {
        ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
      }
    }
  }
  return canvas;
}

function buildSvgDataUrl(qr, cellSize, margin) {
  const count = qr.getModuleCount();
  const size = (count + margin * 2) * cellSize;
  let rects = '';
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < count; c += 1) {
      if (qr.isDark(r, c)) {
        rects += `<rect x="${(c + margin) * cellSize}" y="${(r + margin) * cellSize}" width="${cellSize}" height="${cellSize}"/>`;
      }
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
  return `data:image/svg+xml;base64,${utf8ToBase64(svg)}`;
}

export default {
  id: 'qr-code',
  title: 'QR Code 產生器',
  mode: 'input',
  compute(raw) {
    if (raw.length > 1500) {
      return { valid: false, confidence: 0.1, note: '輸入內容過長，超過 QR Code 容量上限' };
    }
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(raw);
      qr.make();
      const pngDataUrl = buildCanvas(qr, 5, 2).toDataURL('image/png');
      const svgDataUrl = buildSvgDataUrl(qr, 5, 2);
      return {
        valid: true,
        confidence: 0.25,
        sections: [
          {
            rows: [
              {
                type: 'image',
                value: pngDataUrl,
                filename: 'qrcode.png',
                alt: 'QR code',
                extraDownloads: [{ label: 'SVG', value: svgDataUrl, filename: 'qrcode.svg' }],
              },
            ],
          },
        ],
      };
    } catch (e) {
      return { valid: false, confidence: 0, note: '無法產生 QR Code：' + e.message };
    }
  },
};
