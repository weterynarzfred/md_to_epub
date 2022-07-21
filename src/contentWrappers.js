function getContentOpf(data) {
  return `<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uuid">
  <metadata xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${data.title}</dc:title>
    <dc:creator opf:role="aut" opf:file-as="${data.author}">${data.author}</dc:creator>
    <dc:language>${data.language}</dc:language>
    <dc:publisher>${data.publisher}</dc:publisher>
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

function getHtmlStructure(data) {
  let content = '';
  for (const section of data.sections) {
    content += section.html;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
  <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${data.language}" lang="${data.language}">
    <head>
      <title />
      <link href="../Styles/style.css" rel="stylesheet" type="text/css" />
    </head>
  
    <body>
    ${data.isStoryGroup ? `<h1>${data.title}</h1>` : ''}
${content}
  </body>
</html>
`;
}

module.exports = { getContentOpf, getHtmlStructure };