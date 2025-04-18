// const SOURCE_PATH = "./content/";
const SOURCE_PATH = "H:/proton/My files/obsidian/pisanie_2/";
const SETTINGS = {
  author: 'Weterynarzfred',
  publisher: 'Weterynarzfred Publishing House',
  language: 'en', // when using with xelatex only polish and english are working for now
  convertToPdf: true, // uses xelatex
  filter: (params, fileName) => {
    // params?.tag === 'prose' &&
    // params?.skip !== 'true' &&
    // params?.order !== '"000"',
    //   fileName === 'Nyxia\'s pride.md',
    return params?.story === 'The Hermit Queen of Kaos and Stars';
  },
  parseGtAsProps: true,
  addEmptyLines: true,
  hyphenate: true, // pdfs made with xelatex are always hyphenated
  replaceSeparators: true,
  stripCodeBlocks: ['dataview', 'dataviewjs'],
  stripComments: false,
  useDropCaps: false, // pdf
};

module.exports = { SOURCE_PATH, SETTINGS };

try {
  // module.exports.TEXT_CONTEXT = require.context("../content/", false, /\.md$/);
  module.exports.TEXT_CONTEXT = require.context("P:/pisanie/", false, /\.md$/);
} catch (error) { }
