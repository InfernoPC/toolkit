import { utf8ToBase64 } from './_shared.js';

export default {
  id: 'base64-encode',
  title: 'Base64 Encode',
  mode: 'input',
  compute(raw) {
    return {
      valid: true,
      confidence: 0.2,
      sections: [{ rows: [{ value: utf8ToBase64(raw) }] }],
    };
  },
};
