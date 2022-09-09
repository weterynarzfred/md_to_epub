// const SOURCE_PATH = "./content/";
const SOURCE_PATH = "P:/pisanie/";
const SETTINGS = {
  author: 'Weterynarzfred',
  publisher: 'Weterynarzfred Publishing House',
  language: 'en', // when using with xelatex only polish and english are working for now
  convertToPdf: true, // uses xelatex
  filter: (params, _fileName) => params?.tag === 'prose' &&
    params?.skip !== 'true',
  parseGtAsProps: true,
  addEmptyLines: true,
  hyphenate: true, // pdfs made with xelatex are always hyphenated
  replaceSeparators: true,
  stripCodeBlocks: ['dataview', 'dataviewjs'],
  stripComments: true,
};

module.exports = { SOURCE_PATH, SETTINGS };

try {
  // module.exports.TEXT_CONTEXT = require.context("../content/", false, /\.md$/);
  module.exports.TEXT_CONTEXT = require.context("P:/pisanie/", false, /\.md$/);
} catch (error) { }
