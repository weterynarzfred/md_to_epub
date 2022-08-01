const SOURCE_PATH = "./content/";
const SETTINGS = {
  author: 'Weterynarzfred',
  publisher: 'Weterynarzfred Publishing House',
  language: 'en',
  filter: data => data.params.tag === 'prose',
  parseGtAsProps: true,
  addEmptyLines: true,
  hyphenate: true,
  replaceSeparators: true,
  stripCodeBlocks: ['dataviewjs'],
};

module.exports = { SOURCE_PATH, SETTINGS };

try {
  module.exports.TEXT_CONTEXT = require.context("../content/", true, /\.md$/);
} catch (error) { }
