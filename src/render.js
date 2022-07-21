// cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ

const fs = require('fs');
const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt();
const JSZip = require('jszip');

const SOURCE_PATH = "P:/pisanie/pisanie/";
const INFO = {
  author: 'test author',
  publisher: 'test publisher',
};

function getContentOpf(options) {
  return `<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uuid">
  <metadata xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${options.title}</dc:title>
    <dc:creator opf:role="aut" opf:file-as="${options.author}">${options.author}</dc:creator>
    <dc:language>${options.language}</dc:language>
    </metadata>
  <manifest>
    <item id="text.xhtml" href="Text/text.xhtml" media-type="application/xhtml+xml"/>
    <item id="style.css" href="Styles/style.css" media-type="text/css"/>
  </manifest>
  <spine toc="id1">
    <itemref idref="text.xhtml"/>
  </spine>
</package>`;
}

function getHtmlStructure(content, options) {
  return `<?xml version="1.0" encoding="utf-8"?>
  <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${options.language}" lang="${options.language}">
    <head>
      <title />
      <link href="../Styles/style.css" rel="stylesheet" type="text/css" />
    </head>
  
    <body>
${content}
  </body>
</html>
`;
}

function makeEpub(title, data) {
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

function processMarkdown(inputMarkdown) {
  const params = {};
  const markdown = inputMarkdown
    .replaceAll(/^> *(.*)$\n/gm, (_match, group_1) => {
      if (group_1?.[0] === '#') {
        params['tag'] = group_1.slice(1).replace(/ +$/, '');
      } else {
        const groupSplit = group_1.split(/:: */);
        const key = groupSplit.shift();
        const value = groupSplit.join(' ');
        if (value !== undefined) {
          params[key] = value;
        }
      }
      return '';
    });

  if (params.tag !== 'prose') return false;

  let html = markdown
    .replaceAll(/^(#+) /gm, '$1# ') // increase heading depth
    .replaceAll(/^— /gm, '—&#x2004;') // change spaces after em-dashes to constant width
    .replaceAll(/ ([a-zA-Z—–-]) /g, " $1&nbsp;") // orphans
    .replaceAll(/$\n/gm, '\n\n'); // add empty space between paragraphs

  try {
    const hyphen = require(`hyphen/${params.language}`);
    html = hyphen.hyphenateHTMLSync(html);
  } catch (e) { }
  html = md.render(html);

  return {
    params,
    inputMarkdown,
    markdown,
    html,
  };
}

function render() {
  const isMarkdownFileRegex = new RegExp('\.md$');
  let files = fs.readdirSync(SOURCE_PATH)
    .filter(file => isMarkdownFileRegex.test(file));

  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }

  for (const file of files) {
    const markdown = fs.readFileSync(SOURCE_PATH + file, 'utf8');
    data = processMarkdown(markdown, file);
    if (data) makeEpub(file.replace(/\.md$/, ''), data);
  }
}


module.exports = render;