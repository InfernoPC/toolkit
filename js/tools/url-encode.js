export default {
  id: 'url-encode',
  title: 'URL Encode',
  mode: 'input',
  compute(raw) {
    return {
      valid: true,
      confidence: 0.2,
      sections: [{ rows: [{ value: encodeURIComponent(raw) }] }],
    };
  },
};
