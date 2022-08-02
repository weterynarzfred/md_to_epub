// cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ

const fs = require('fs');
const JSZip = require('jszip');
const { SETTINGS } = require('../constants');
const sanitizeFilename = require('./sanitizeFilename');

function makeEpub(data) {
  const { getHtmlStructure, getContentOpf } = require('./contentWrappers');

  return new Promise(resolve => {
    data.author = data.author.length === 0 ? [SETTINGS.author] : data.author;
    data.publisher = data.publisher.length === 0 ? [SETTINGS.publisher] : data.publisher;
    data.language = data.language ?? SETTINGS.language;

    zip = new JSZip();
    zip.file('mimetype', fs.readFileSync('./src/epub_parts/mimetype'));

    const zipMeta = zip.folder('META-INF');
    zipMeta.file('container.xml', fs.readFileSync('./src/epub_parts/container.xml'));

    const zipOebps = zip.folder('OEBPS');
    zipOebps.file('content.opf', getContentOpf(data));
    zipOebps.folder('Styles')
      .file('style.css', fs.readFileSync('./src/epub_parts/style.css'));
    zipOebps.folder('Text')
      .file('text.xhtml', getHtmlStructure(data));

    data.fileName = (data.isStoryGroup ? '_' : '') + sanitizeFilename(data.title);
    zip
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(fs.createWriteStream('./output/' + data.fileName + '.epub'))
      .on('finish', resolve);
  });
}

module.exports = makeEpub;