// const SOURCE_PATH = "./content/";
const SOURCE_PATH = "P:/pisanie/pisanie/";
const SETTINGS = {
  author: 'Weterynarzfred',
  publisher: 'Weterynarzfred Publishing House',
  language: 'en',
  filter: (params, _fileName) => params?.tag === 'prose',
  parseGtAsProps: true,
  addEmptyLines: true,
  hyphenate: true,
  replaceSeparators: true,
  stripCodeBlocks: ['dataview', 'dataviewjs'],
};

module.exports = { SOURCE_PATH, SETTINGS };

try {
  module.exports.TEXT_CONTEXT = require.context("P:/pisanie/pisanie/", false, /\.md$/);
} catch (error) { }
