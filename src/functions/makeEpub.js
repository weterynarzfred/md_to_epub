// cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ

const fs = require('fs');
const JSZip = require('jszip');
const { SETTINGS } = require('../constants');

function makeEpub(data) {
  const { getHtmlStructure, getContentOpf } = require('./contentWrappers');

  data.author = data.author ?? SETTINGS.author;
  data.publisher = data.publisher ?? SETTINGS.publisher;
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

  const fileName = (data.isStoryGroup ? '_' : '') + data.title.replace(/[^a-zA-Z0-9 -_ęóąśłżźćńĘÓĄŚŁŻŹĆŃ]/, '');
  zip
    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
    .pipe(fs.createWriteStream('./output/' + fileName + '.epub'))
    .on('finish', () => {
      console.log(data.title + ' done');
    });
}

module.exports = makeEpub;