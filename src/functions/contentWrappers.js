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

  let content = '';
  for (const section of data.sections) {
    processMarkdownToTex(section);
    content += section.markdownTex;
  }

  // const style = 'print';
  const style = 'screen';
  const margins = [1.6, 1.6, 1.6, 1.6];
  const bidingOffset = 0.6;
  const useToc = false;
  const useChapterNumbers = false;

  // TODO: add an option to disable drop caps
  // cSpell:disable
  return `% chktex-file 1
\\documentclass[10pt, twoside, hidelinks]{article}

\\usepackage{emptypage}
\\usepackage[protrusion]{microtype} % micro typography - protrusions
\\usepackage[${languages[data.language]}]{babel} % for hyphenation, I think
\\usepackage[all,defaultlines=2]{nowidow} % deal with widows and orphans
\\usepackage{needspace}
\\usepackage{pgfornament}
\\usepackage{incgraph}

${style === 'screen' ? `\\usepackage[paperheight=210mm, paperwidth=148mm, top=${margins[0]}cm, bottom=${margins[2]}cm, left=${margins[3] + bidingOffset / 2}cm, right=${margins[1] + bidingOffset / 2}cm, footskip=0.75cm]{geometry}` : ''}
${style === 'print' ? `\\usepackage[paperheight=210mm, paperwidth=148mm, bindingoffset=${bidingOffset}cm, top=${margins[0]}cm, bottom=${margins[2]}cm, left=${margins[3]}cm, right=${margins[1]}cm, footskip=0.75cm]{geometry}` : ''}

% hyphenation settings - https://tug.org/utilities/plain/cseq.html
\\doublehyphendemerits=900000
\\finalhyphendemerits=900000
\\pretolerance=-1
\\tolerance=400
\\setlength{\\emergencystretch}{2em}

% set fonts
\\usepackage{fontspec}
\\setmainfont{Crimson Text}

% substitute missing three per em space
\\usepackage{newunicodechar}
\\newfontfamily\\fallbackfont{CMU Serif Roman}
\\newunicodechar{ }{{\\fallbackfont\\symbol{"2004}}} % chktex 18

% hide some warnings
\\raggedbottom
\\hbadness=3000
\\hfuzz=2pt

% styling titles
\\usepackage{titlesec}
${useChapterNumbers ? `
\\titleformat{\\section}[block]{\\vspace*{2\\baselineskip}\\LARGE\\bfseries\\filcenter}{\\footnotesize\\textmd{Rozdział \\thetitle}\\\\}{0pt}{}
` : `
\\titleformat{\\section}[block]{\\vspace*{\\baselineskip}\\LARGE\\bfseries\\filcenter}{\\footnotesize\\\\}{0pt}{}
`}
\\titlespacing*{\\section}{0pt}{0pt}{2.37\\baselineskip}

% begin each section on a new page
${style === 'screen' ? `\\newcommand*{\\OrgSection}{}
\\let\\OrgSection\\section
\\renewcommand*{\\section}{\\clearpage\\OrgSection}` : ''}
${style === 'print' ? `\\newcommand*{\\OrgSection}{}
\\let\\OrgSection\\section
\\renewcommand*{\\section}{\\cleardoublepage\\OrgSection}` : ''}

% table of contents
\\usepackage{titletoc}
\\contentsmargin{0em}
\\renewcommand\\contentspage{\\hspace{.2em}\\thecontentspage}
\\renewcommand\\contentslabel{}
\\titlecontents{section}[0em]{}{}{}{\\hspace{0.2em}\\titlerule*[0.5em]{.}\\contentspage}
\\titlecontents{subsection}[1em]{}{}{}{\\hspace{0.2em}\\titlerule*[0.5em]{.}\\contentspage}
\\titlecontents{subsubsection}[2em]{}{}{}{\\hspace{0.2em}\\titlerule*[0.5em]{.}\\contentspage}
\\addto{\\captionspolish}{\\renewcommand*{\\contentsname}{\\vspace*{-2.25\\baselineskip} \\\\ Spis Treści \\vspace*{-0.5\\baselineskip}}}

% paragraphs
\\usepackage{parskip}
\\setlength{\\parskip}{0pt} % paragraph spacing
\\setlength{\\parindent}{1.5em} % indentation
\\setlength{\\lineskiplimit}{-1em} % this somehow helps make section titles height to be an integer multiple of baselineskip

% drop caps
\\usepackage{lettrine}
\\usepackage{textcase}
\\renewcommand{\\LettrineTextFont}{\\footnotesize\\MakeTextUppercase}

% line height
\\linespread{1.15}

% change page numbering style
\\setlength{\\headheight}{0pt}
\\usepackage{fancyhdr}
\\fancypagestyle{fancy}{
  \\fancyhf{}
${style === 'screen' ? `\\fancyfoot[C]{--- \\thepage\\ ---}` : ''}
${style === 'print' ? `\\fancyfoot[OR]{\\thepage}
\\fancyfoot[EL]{\\thepage}` : ''}
  \\renewcommand{\\headrulewidth}{0pt}
}
\\fancypagestyle{plain}{
  \\fancyhf{}
}
\\pagestyle{fancy}

% macros
\\newcommand{\\pov}[1]{
  \\needspace{1.5\\baselineskip}
  \\vspace{2\\baselineskip}
  \\begin{center}
  \\textbf{#1}
  \\end{center}
  \\vspace{\\baselineskip}
  \\noindent\\ignorespaces
}

\\newcommand{\\sectionpov}[1]{
  \\vspace{0em}
  \\begin{center}
  \\textbf{#1}
  \\end{center}
  \\vspace{\\baselineskip}
  \\noindent\\ignorespaces
}

\\newcommand{\\scenebreak}{
  \\needspace{1.5\\baselineskip}
  \\vspace{\\baselineskip}
  \\begin{center}
    \\pgfornament[width = 3cm]{88}
  \\end{center}
  \\vspace{\\baselineskip}
  \\noindent\\ignorespaces
}

\\newcount\\zzc
\\makeatletter
\\def\\zz{%
\\ifnum\\prevgraf<\\c@L@lines
\\zzc\\z@
\\loop
\\ifnum\\zzc<\\prevgraf
\\advance\\zzc\\@ne
\\afterassignment\\zzda\\count@\\L@parshape\\relax
\\repeat
\\parshape\\L@parshape
\\fi}
\\def\\zzda{\\afterassignment\\zzdb\\dimen@}
\\def\\zzdb{\\afterassignment\\zzdef\\dimen@}
\\def\\zzdef#1\\relax{\\edef\\L@parshape{\\the\\numexpr\\count@-1\\relax\\space #1}}
\\makeatother

% -----
\\title{\\vspace{3em}\\Huge\\bfseries{${data.title.replace('_', '\\_')}}\\vspace{0em}}
\\author{\\normalsize ${data.author.join(', ').replace('_', '\\_')}}
\\date{}

\\begin{document}

${data.cover === undefined ? '' : `\\incgraph{${SOURCE_PATH}${data.cover}}`}

${content}

${style === 'print' ? `
\\newpage
\\thispagestyle{empty}
\\mbox{}
\\newpage
` : ''}

${useToc ? `
\\clearpage
\\pdfbookmark{Spis Treści}{toc}
\\tableofcontents
` : ''}

\\end{document}`;
  // cSpell:enable
}

module.exports = { getContentOpf, getHtmlStructure, getEpubTitlePage, getTexStructure };
