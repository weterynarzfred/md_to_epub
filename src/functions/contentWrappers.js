const crypto = require('crypto');
const { SOURCE_PATH } = require('../constants');
const processMarkdownToTex = require('./processMarkdownToTex');

function getContentOpf(data) {
  const authorSort = data.author.reduce((accumulator, curr) => {
    const sort = curr.split(' ');
    sort.unshift(sort.pop());
    accumulator.push(sort.join(' ').replace(' ', ', '));
    return accumulator;
  }, []).join(' &amp; ');

  const authors = data.author
    .map(author => `<dc:creator opf:role="aut" opf:file-as="${authorSort}">${author}</dc:creator>`)
    .join('\n');

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
    ${data.cover === undefined ? '' : '<item id="titlepage.xhtml" href="Text/titlepage.xhtml" media-type="application/xhtml+xml"/>'}
    <item id="text.xhtml" href="Text/text.xhtml" media-type="application/xhtml+xml"/>
    <item id="style.css" href="Styles/style.css" media-type="text/css"/>
    ${data.cover === undefined ? '' : `<item id="cover" href="${data.cover}" media-type="image/jpeg"/>`}
  </manifest>
  <spine>
    ${data.cover === undefined ? '' : '<itemref idref="titlepage.xhtml"/>'}
    <itemref idref="text.xhtml"/>
  </spine>
</package>`;
}

function getHtmlStructure(data) {
  let content = '';
  for (const section of data.sections)
    content += `<div class="section">${section.html}</div>`;

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

function getEpubTitlePage(data) {
  if (data.cover === undefined) return;

  return `<?xml version='1.0' encoding='utf-8'?>
  <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
      <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
          <meta name="calibre:cover" content="true"/>
          <title>Cover</title>
          <style type="text/css" title="override_css">
              @page {padding: 0pt; margin:0pt}
              body { text-align: center; padding:0pt; margin: 0pt; }
          </style>
      </head>
      <body>
          <div>
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 1480 2100" preserveAspectRatio="xMidYMid meet">
                  <image width="1480" height="2100" xlink:href="../${data.cover}"/>
              </svg>
          </div>
      </body>
  </html>
  `;
}

function getTexStructure(data) {
  const languages = {
    pl: 'polish',
    en: 'english',
    polish: 'polish',
    english: 'english',
    Polish: 'polish',
    English: 'english',
  };

  const texLanguage = languages[data.language] || 'english';
  const secondaryLanguage = texLanguage === 'english' ? 'polish' : 'english';
  const tocTitle = texLanguage === 'polish' ? 'Spis Tre\u015bci' : 'Table of Contents';
  const useToc = false;

  let content = '';
  for (const section of data.sections) {
    processMarkdownToTex(section);
    content += section.markdownTex;
  }

  return `% chktex-file 1
\\documentclass[10pt,twoside]{article}

\\usepackage[
  paperheight=210mm,
  paperwidth=148mm,
  top=1.6cm,
  bottom=1.6cm,
  inner=1.9cm,
  outer=1.9cm,
  footskip=0.75cm
]{geometry}

\\usepackage{microtype}
\\usepackage[all,defaultlines=2]{nowidow}
\\finalhyphendemerits=1000000
\\tolerance=1000
\\setlength{\\emergencystretch}{2em}

\\usepackage{fontspec}
\\usepackage{polyglossia}
\\setdefaultlanguage{${texLanguage}}
\\setotherlanguage{${secondaryLanguage}}

\\usepackage{xeCJK}
\\setmainfont{Crimson Pro}
\\setmonofont{Fira Code}
\\setCJKmainfont{Noto Serif JP}
\\setCJKmonofont{Noto Serif JP}
\\xeCJKsetup{AllowBreakBetweenPuncts=false}

\\usepackage{newunicodechar}
\\newunicodechar{\u2004}{\\hspace{0.333em}}

\\usepackage{textcomp}
\\usepackage[hidelinks]{hyperref}
\\usepackage{xurl}
\\urlstyle{same}

\\usepackage{titlesec}
\\setcounter{secnumdepth}{0}
\\titleformat{\\section}[block]{\\vspace*{\\baselineskip}\\LARGE\\bfseries\\filcenter}{}{0pt}{}
\\titlespacing*{\\section}{0pt}{0pt}{2\\baselineskip}

\\let\\OriginalSection\\section
\\renewcommand*{\\section}{\\clearpage\\OriginalSection}

\\renewcommand{\\contentsname}{${tocTitle}}

\\usepackage{parskip}
\\setlength{\\parskip}{0pt}
\\setlength{\\parindent}{1.5em}
\\clubpenalty=10000
\\widowpenalty=10000
\\displaywidowpenalty=10000

\\newcommand{\\AfterListNoIndent}{\\par\\noindent\\ignorespaces}
\\usepackage{enumitem}
\\setlist[itemize]{leftmargin=1.5em,after=\\AfterListNoIndent}
\\setlist[enumerate]{leftmargin=1.5em,after=\\AfterListNoIndent}

\\usepackage{needspace}
\\usepackage{pgfornament}
\\usepackage{incgraph}

\\usepackage{xcolor}
\\usepackage{fvextra}
\\definecolor{codeGruvFg}{HTML}{3C3836}
\\definecolor{codeGruvGray}{HTML}{928374}
\\definecolor{codeGruvRed}{HTML}{CC241D}
\\definecolor{codeGruvGreen}{HTML}{98971A}
\\definecolor{codeGruvYellow}{HTML}{D79921}
\\definecolor{codeGruvBlue}{HTML}{458588}
\\definecolor{codeGruvPurple}{HTML}{B16286}
\\definecolor{codeGruvAqua}{HTML}{689D6A}
\\definecolor{codeGruvOrange}{HTML}{D65D0E}
\\definecolor{codeframe}{HTML}{D5C4A1}
\\newcommand{\\mdcodefont}{\\ttfamily\\fontsize{6.5}{8}\\selectfont\\color{codeGruvFg}}
\\DefineVerbatimEnvironment{mdcodeblock}{Verbatim}{
  commandchars=\\\\\\{\\},
  breaklines=true,
  breakanywhere=true,
  breakautoindent=true,
  breaksymbolleft={},
  breaksymbolright={},
  formatcom=\\mdcodefont,
  frame=single,
  framerule=0.4pt,
  rulecolor=\\color{codeframe},
  framesep=4pt
}
\\newcommand{\\mdinlinecode}[1]{{\\mdcodefont\\color{codeGruvBlue} #1}}

\\setlength{\\headheight}{0pt}
\\usepackage{fancyhdr}
\\fancypagestyle{fancy}{
  \\fancyhf{}
  \\fancyfoot[C]{\\thepage}
  \\renewcommand{\\headrulewidth}{0pt}
}
\\fancypagestyle{plain}{
  \\fancyhf{}
}
\\pagestyle{fancy}

\\newcommand{\\pov}[1]{
  \\Needspace{4\\baselineskip}
  \\vspace{2\\baselineskip}
  \\begin{center}
    \\textbf{#1}
  \\end{center}
  \\vspace{\\baselineskip}
  \\par\\noindent\\ignorespaces
}

\\newcommand{\\sectionpov}[1]{
  \\begin{center}
    \\textbf{#1}
  \\end{center}
  \\vspace{\\baselineskip}
  \\par\\noindent\\ignorespaces
}

\\newcommand{\\scenebreak}{
  \\Needspace{3\\baselineskip}
  \\vspace{\\baselineskip}
  \\begin{center}
    \\pgfornament[width=3cm]{88}
  \\end{center}
  \\vspace{\\baselineskip}
  \\noindent\\ignorespaces
}

\\begin{document}

${data.cover === undefined ? '' : `\\incgraph{${SOURCE_PATH}${data.cover}}`}

${content}

${useToc ? `
\\clearpage
\\tableofcontents
` : ''}

\\end{document}`;
}

module.exports = {
  getContentOpf,
  getHtmlStructure,
  getEpubTitlePage,
  getTexStructure,
};
