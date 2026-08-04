export default {
  id: 'uuid-generator',
  title: 'UUID 產生器',
  mode: 'generator',
  compute() {
    const id = crypto.randomUUID();
    return {
      valid: true,
      sections: [
        {
          rows: [
            { label: '標準', value: id },
            { label: '大寫', value: id.toUpperCase() },
            { label: '無破折號', value: id.replace(/-/g, '') },
          ],
        },
      ],
    };
  },
};
