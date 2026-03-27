const SOURCE_PATH = process.env.MD_TO_EPUB_SOURCE_PATH || "H:/proton/My files/obsidian/pisanie/";

const SETTINGS = {
  author: 'Weterynarzfred',
  publisher: 'Weterynarzfred Publishing House',
  language: 'en', // default language for epub metadata and TeX babel config
  convertToPdf: true, // run xelatex passes after epub generation
  filter: (params, fileName) => {
    return !params.skip &&
      params.tag?.split(' ').includes('prose');
    // return fileName === 'diary.md';
  },
  parseGtAsProps: true, // parse lines starting with ">" into params
  addEmptyLines: true, // keep single line-break pacing
  hyphenate: true, // html/epub hyphenation (pdf is handled by TeX)
  replaceSeparators: true, // map markdown separators to styled scene breaks
  stripCodeBlocks: ['dataview', 'dataviewjs'],
  stripComments: false,
  useDropCaps: false, // TeX drop caps
};

module.exports = { SOURCE_PATH, SETTINGS };

// Used by the React preview app (webpack only). Node scripts ignore this.
if (typeof require.context === 'function') {
  module.exports.TEXT_CONTEXT = require.context("../content/", false, /\.md$/);
}
