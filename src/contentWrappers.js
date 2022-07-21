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

module.exports = { getContentOpf, getHtmlStructure };