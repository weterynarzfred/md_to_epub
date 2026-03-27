const SOURCE_PATH = process.env.MD_TO_EPUB_SOURCE_PATH || "H:/pdf_gen_test/";

const SETTINGS = {
  author: 'Weterynarzfred',
  publisher: 'Weterynarzfred Publishing House',
  language: 'en', // default language for epub metadata and TeX language config
  convertToPdf: true, // run xelatex passes after epub generation
  filter: (params, fileName) => {
    if (fileName === 'diary.md') return true;
    if (params.skip) return false;

    const tags = params.tag?.split(/\s+/).filter(Boolean) ?? [];
    return tags.includes('prose') || tags.includes('article');
  },
  parseGtAsProps: true, // parse lines starting with ">" into params
  addEmptyLines: true, // keep single line-break pacing
  hyphenate: true, // html/epub hyphenation (pdf is handled by TeX)
  replaceSeparators: true, // map markdown separators to styled scene breaks
  stripCodeBlocks: ['dataview', 'dataviewjs'],
  stripComments: false,
};

module.exports = { SOURCE_PATH, SETTINGS };
