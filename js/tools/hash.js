async function sha(algo, raw) {
  const buf = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest(algo, buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default {
  id: 'hash',
  title: 'Hash (MD5 / SHA-1 / SHA-256)',
  mode: 'input',
  async compute(raw) {
    const [sha1, sha256] = await Promise.all([sha('SHA-1', raw), sha('SHA-256', raw)]);
    const md5Hex = window.md5(raw);
    return {
      valid: true,
      confidence: 0.2,
      sections: [
        {
          rows: [
            { label: 'MD5', value: md5Hex },
            { label: 'SHA-1', value: sha1 },
            { label: 'SHA-256', value: sha256 },
          ],
        },
      ],
    };
  },
};
