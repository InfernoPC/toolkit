import {
  clamp,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToCmyk,
  cmykToRgb,
  contrastRatio,
} from './_shared.js';

const BLACK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

function formatRatio(ratio) {
  return `${ratio.toFixed(2)}:1 (AA ${ratio >= 4.5 ? '✓' : '✗'} · AAA ${ratio >= 7 ? '✓' : '✗'})`;
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
    const cmykMatch = /^cmyk\(\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/i.exec(
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
    } else if (cmykMatch) {
      rgb = cmykToRgb({
        c: clamp(Number(cmykMatch[1]), 0, 100),
        m: clamp(Number(cmykMatch[2]), 0, 100),
        y: clamp(Number(cmykMatch[3]), 0, 100),
        k: clamp(Number(cmykMatch[4]), 0, 100),
      });
      confidence = 0.9;
    }

    if (!rgb) {
      return {
        valid: false,
        confidence: 0,
        note: '不是可辨識的顏色格式（#hex / rgb() / hsl() / cmyk()）',
      };
    }

    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);
    const cmyk = rgbToCmyk(rgb);

    const ratioOnBlack = contrastRatio(rgb, BLACK);
    const ratioOnWhite = contrastRatio(rgb, WHITE);
    const recommended = ratioOnWhite >= ratioOnBlack ? { name: '白色', hex: '#ffffff', ratio: ratioOnWhite } : { name: '黑色', hex: '#000000', ratio: ratioOnBlack };

    const complementaryHsl = { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l };
    const complementaryHex = rgbToHex(hslToRgb(complementaryHsl));

    return {
      valid: true,
      confidence,
      sections: [
        {
          rows: [
            { label: 'HEX', value: hex, swatch: hex },
            { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
            { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
            { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
          ],
        },
        {
          label: '對比與互補',
          rows: [
            {
              label: '建議文字色',
              value: `${recommended.name} (${recommended.hex}) · 對比度 ${formatRatio(recommended.ratio)}`,
              swatch: recommended.hex,
            },
            { label: '互補色', value: complementaryHex, swatch: complementaryHex },
          ],
        },
      ],
    };
  },
};
