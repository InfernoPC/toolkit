import { hslToRgb, rgbToHex } from './_shared.js';

function randomInt(min, max) {
  return min + (crypto.getRandomValues(new Uint32Array(1))[0] % (max - min + 1));
}

function hexAtHue(baseHue, offset, s, l) {
  const h = ((baseHue + offset) % 360 + 360) % 360;
  return rgbToHex(hslToRgb({ h, s, l }));
}

export default {
  id: 'random-color',
  title: '隨機顏色 / 調色盤',
  mode: 'generator',
  compute() {
    const hue = randomInt(0, 359);
    const s = 65;
    const l = 55;

    return {
      valid: true,
      sections: [
        {
          rows: [
            { label: '主色', value: hexAtHue(hue, 0, s, l), swatch: hexAtHue(hue, 0, s, l) },
            { label: '互補色', value: hexAtHue(hue, 180, s, l), swatch: hexAtHue(hue, 180, s, l) },
            { label: '類似色 1', value: hexAtHue(hue, 30, s, l), swatch: hexAtHue(hue, 30, s, l) },
            { label: '類似色 2', value: hexAtHue(hue, -30, s, l), swatch: hexAtHue(hue, -30, s, l) },
            { label: '三等分色', value: hexAtHue(hue, 120, s, l), swatch: hexAtHue(hue, 120, s, l) },
          ],
        },
      ],
    };
  },
};
