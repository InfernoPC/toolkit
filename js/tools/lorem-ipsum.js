const WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(
    ' '
  );

function randomInt(min, max) {
  return min + (crypto.getRandomValues(new Uint32Array(1))[0] % (max - min + 1));
}

function randomWord() {
  return WORDS[randomInt(0, WORDS.length - 1)];
}

function buildSentence() {
  const length = randomInt(6, 14);
  const words = Array.from({ length }, randomWord);
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function buildParagraph() {
  const sentenceCount = randomInt(3, 6);
  return Array.from({ length: sentenceCount }, buildSentence).join(' ');
}

export default {
  id: 'lorem-ipsum',
  title: 'Lorem Ipsum 產生器',
  mode: 'generator',
  compute() {
    const paragraphs = Array.from({ length: 3 }, buildParagraph);
    return {
      valid: true,
      sections: [
        {
          rows: paragraphs.map((p, i) => ({ label: `第 ${i + 1} 段`, value: p })),
        },
      ],
    };
  },
};
