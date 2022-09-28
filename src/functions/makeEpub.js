// cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ

const fs = require('fs');
const JSZip = require('jszip');

const { SETTINGS, SOURCE_PATH } = require('../constants');
const sanitizeFilename = require('./sanitizeFilename');

function makeEpub(data) {
  const { getHtmlStructure, getContentOpf, getEpubTitlePage } = require('./contentWrappers');

  return new Promise(resolve => {
    data.author = data.author.length === 0 ? [SETTINGS.author] : data.author;
    data.publisher = data.publisher.length === 0 ? [SETTINGS.publisher] : data.publisher;
    data.language = data.language ?? SETTINGS.language;

    zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip');

    const zipMeta = zip.folder('META-INF');
    zipMeta.file('container.xml', fs.readFileSync('./src/epub_parts/container.xml'));

    const zipOebps = zip.folder('OEBPS');
    zipOebps.file('content.opf', getContentOpf(data));
    zipOebps.folder('Styles')
      .file('style.css', fs.readFileSync('./src/epub_parts/style.css'));
    zipText = zipOebps.folder('Text');
    if (data.cover !== undefined) {
      zipText.file('titlepage.xhtml', getEpubTitlePage(data));
      zipOebps.file(data.cover, fs.readFileSync(SOURCE_PATH + data.cover));
    }
    zipText.file('text.xhtml', getHtmlStructure(data));

    data.fileName = (data.isStoryGroup ? '_' : '') + sanitizeFilename(data.title);
    zip
      .generateNodeStream({ type: 'nodebuffer', mimeType: 'application/epub+zip' })
      .pipe(fs.createWriteStream('./output/' + data.fileName + '.epub'))
      .on('finish', resolve);
  });
}

module.exports = makeEpub;