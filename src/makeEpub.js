// cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ

const fs = require('fs');
const JSZip = require('jszip');

function makeEpub(title, data) {
  const { getHtmlStructure, getContentOpf } = require('./contentWrappers');
  const { INFO } = require('./render');

  const options = {
    title: title,
    author: data.author ?? INFO.author,
    publisher: data.publisher ?? INFO.publisher,
    language: data.params.language,
  };

  zip = new JSZip();
  zip.file('mimetype', fs.readFileSync('./epub_parts/mimetype'));

  const zipMeta = zip.folder('META-INF');
  zipMeta.file('container.xml', fs.readFileSync('./epub_parts/container.xml'));

  const zipOebps = zip.folder('OEBPS');
  zipOebps.file('content.opf', getContentOpf(options));
  zipOebps.folder('Text')
    .file('text.xhtml', getHtmlStructure(data.html, options));
  zipOebps.folder('Styles')
    .file('style.css', fs.readFileSync('./epub_parts/style.css'));

  zip
    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
    .pipe(fs.createWriteStream('./output/' + title.replace(/[^a-zA-Z0-9 -_ęóąśłżźćńĘÓĄŚŁŻŹĆŃ]/) + '.epub'))
    .on('finish', () => {
      console.log(title + ' done');
    });
}

module.exports = makeEpub;