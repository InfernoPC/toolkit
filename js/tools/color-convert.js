function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export default {
  id: 'color-convert',
  title: '顏色格式轉換',
  mode: 'input',
  compute(raw) {
    const trimmed = raw.trim();
    let rgb = null;
    let confidence = 0;

    const hexMatch = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed);
    const rgbMatch = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(
      trimmed
    );
    const hslMatch = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(
      trimmed
    );

    if (hexMatch) {
      rgb = hexToRgb(hexMatch[1]);
      confidence = 0.9;
    } else if (rgbMatch) {
      rgb = {
        r: clamp(Number(rgbMatch[1]), 0, 255),
        g: clamp(Number(rgbMatch[2]), 0, 255),
        b: clamp(Number(rgbMatch[3]), 0, 255),
      };
      confidence = 0.9;
    } else if (hslMatch) {
      rgb = hslToRgb({
        h: clamp(Number(hslMatch[1]), 0, 360),
        s: clamp(Number(hslMatch[2]), 0, 100),
        l: clamp(Number(hslMatch[3]), 0, 100),
      });
      confidence = 0.9;
    }

    if (!rgb) {
      return { valid: false, confidence: 0, note: '不是可辨識的顏色格式（#hex / rgb() / hsl()）' };
    }

    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);

    return {
      valid: true,
      confidence,
      sections: [
        {
          rows: [
            { label: 'HEX', value: hex, swatch: hex },
            { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
            { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
          ],
        },
      ],
    };
  },
};
