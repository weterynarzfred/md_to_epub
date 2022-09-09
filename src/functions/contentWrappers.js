const crypto = require('crypto');
const processMarkdownToTex = require('./processMarkdownToTex');

function getContentOpf(data) {
  const authorSort = data.author.reduce((accumulator, curr) => {
    const sort = curr.split(' ');
    sort.unshift(sort.pop());
    accumulator.push(sort.join(' ').replace(' ', ', '));
    return accumulator;
  }, []).join(' &amp; ');
  const authors = data.author.map(author => `<dc:creator opf:role="aut" opf:file-as="${authorSort}">${author}</dc:creator>`).join("\n");
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');

  return `<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="md_hash">
  <metadata xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${data.title}</dc:title>
    ${authors}
    <dc:language>${data.language}</dc:language>
    <dc:publisher>${data.publisher.join(', ')}</dc:publisher>
    <dc:identifier id="md_hash" opf:scheme="md_hash">${hash}</dc:identifier>
    </metadata>
  <manifest>
    <item id="text.xhtml" href="Text/text.xhtml" media-type="application/xhtml+xml"/>
    <item id="style.css" href="Styles/style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="text.xhtml"/>
  </spine>
</package>`;
}

function getHtmlStructure(data) {
  let content = '';
  for (const section of data.sections) {
    content += `<div class="section">${section.html}</div>`;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${data.language}" lang="${data.language}">
  <head>
    <title />
    <link href="../Styles/style.css" rel="stylesheet" type="text/css" />
  </head>
  <body>
    ${data.isStoryGroup ? `
<h1>${data.title}</h1>
<div class="author">${data.author.join(', ')}</div>
` : ''}
    ${content}
  </body>
</html>
`;
}

function getTexStructure(data) {
  $languages = {
    pl: 'polish',
    en: 'english',
  };

  let content = '';
  for (const section of data.sections) {
    processMarkdownToTex(section);
    content += section.markdownTex;
  }

  // cSpell:disable
  return `\\documentclass[a4paper,9pt]{extbook}

\\usepackage[protrusion]{microtype} % micro typography - protrusions
\\usepackage[${$languages[data.language]}]{babel} % for hyphenation, I think
\\usepackage[all,defaultlines=2]{nowidow} % deal with widows and orphans
\\usepackage{needspace}

% \\usepackage[paperheight=210mm, paperwidth=148mm, bindingoffset=0cm, top=1.5cm, bottom=2.5cm, left=2cm, right=2cm, footskip=1cm]{geometry} % equal margins
\\usepackage[paperheight=210mm, paperwidth=148mm, bindingoffset=1cm, top=1.5cm, bottom=2.5cm, left=1.5cm, right=1.5cm, footskip=1cm]{geometry} % printing margins

% hyphenation settings - https://tug.org/utilities/plain/cseq.html
\\doublehyphendemerits=100000
\\finalhyphendemerits=100000
\\pretolerance=-1
\\tolerance=400
\\setlength{\\emergencystretch}{2em}
\\brokenpenalty=10000 % prevent breaking pages on hyphenation

% set fonts
\\usepackage{fontspec}
\\setmainfont{cmu serif roman.ttf}[
  BoldFont = cmu serif bold.ttf,
  ItalicFont = cmu serif italic.ttf,
]

% I have no idea but it hides some warnings
\\makeatletter
  \\edef\\orig@output{\\the\\output}
  \\output{\\setbox\\@cclv\\vbox{\\unvbox\\@cclv\\vspace{-20pt plus 40pt}}\\orig@output}
\\makeatother
\\hbadness=3000
\\hfuzz=2pt

% styling titles
\\usepackage{titlesec}
\\titleformat{\\section}[block]{\\Large\\bfseries\\filcenter}{}{1em}{}
\\setcounter{secnumdepth}{0}

% paragraphs
\\usepackage{parskip}
\\setlength{\\parskip}{0pt} % paragraph spacing
\\setlength{\\parindent}{1.5em} % indentation

% begin each section on a new page
% \\newcommand\\sectionbreak{\\cleardoublepage}
\\newcommand\\sectionbreak{\\clearpage}

% line height
\\linespread{1.2}

% change page numbering style
\\setlength{\\headheight}{15pt}
\\usepackage{fancyhdr}
\\fancypagestyle{fancy}{
  \\fancyhf{}
  \\fancyfoot[OR]{\\thepage}
  \\fancyfoot[EL]{\\thepage}
  \\renewcommand{\\headrulewidth}{0pt}
}
\\pagestyle{fancy}

% macros
\\usepackage{xspace}
\\newcommand{\\pov}[1]{
  \\needspace{2\\baselineskip}
  \\vspace{1.2em}
  \\centerline{\\textbf{#1}}
  \\vspace{1.45em}
  \\noindent\\ignorespaces
}

\\usepackage{pgfornament}
\\newcommand{\\scenebreak}{
  \\needspace{2\\baselineskip}
  \\vspace{1.5em}
  \\begin{center}
    \\pgfornament[width = 3cm]{88}
  \\end{center}
  \\vspace{1.2em}
  \\noindent\\ignorespaces
}

% -----
\\title{\\bfseries{${data.title.replace('_', '\\_')}}}
\\author{${data.author.join(', ').replace('_', '\\_')}}
\\date{}

\\begin{document}
\\maketitle

${content}

\\end{document}`;
  // cSpell:enable
}

module.exports = { getContentOpf, getHtmlStructure, getTexStructure };