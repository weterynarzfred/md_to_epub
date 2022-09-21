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

  // const style = 'print';
  const style = 'screen';
  const margins = [1.4, 1.6, 1.9, 1.6];
  const bidingOffset = 0.6;

  // TODO: add an option to disable drop caps
  // cSpell:disable
  return `\\documentclass[10pt,twoside]{article}

\\usepackage{emptypage}
\\usepackage[protrusion]{microtype} % micro typography - protrusions
\\usepackage[${$languages[data.language]}]{babel} % for hyphenation, I think
\\usepackage[all,defaultlines=2]{nowidow} % deal with widows and orphans
\\usepackage{needspace}
\\usepackage{lettrine}
\\usepackage{pgfornament}

${style === 'screen' ? `\\usepackage[paperheight=210mm, paperwidth=148mm, top=${margins[0]}cm, bottom=${margins[2]}cm, left=${margins[3] + bidingOffset / 2}cm, right=${margins[1] + bidingOffset / 2}cm, footskip=0.75cm]{geometry}` : ''}
${style === 'print' ? `\\usepackage[paperheight=210mm, paperwidth=148mm, bindingoffset=${bidingOffset}cm, top=${margins[0]}cm, bottom=${margins[2]}cm, left=${margins[3]}cm, right=${margins[1]}cm, footskip=0.75cm]{geometry}` : ''}

% hyphenation settings - https://tug.org/utilities/plain/cseq.html
\\doublehyphendemerits=100000
\\finalhyphendemerits=100000
\\pretolerance=-1
\\tolerance=400
\\setlength{\\emergencystretch}{2em}
\\brokenpenalty=10000 % prevent breaking pages on hyphenation

% set fonts
\\usepackage{fontspec}
\\setmainfont{Crimson Text}

% substitute missing three per em space
\\usepackage{newunicodechar}
\\newfontfamily\\fallbackfont{CMU Serif Roman}
\\newunicodechar{ }{{\\fallbackfont\\symbol{"2004}}}

% I have no idea, but it hides some warnings
\\makeatletter
  \\edef\\orig@output{\\the\\output}
  \\output{\\setbox\\@cclv\\vbox{\\unvbox\\@cclv\\vspace{-20pt plus 40pt}}\\orig@output}
\\makeatother
\\hbadness=3000
\\hfuzz=2pt

% styling titles
\\usepackage{titlesec}
\\titleformat{\\section}[block]{\\huge\\bfseries\\filcenter}{\\small\\textmd{Rozdział \\thetitle}\\\\}{0pt}{}
\\titlespacing*{\\section}{0pt}{0pt}{3.77em}

% begin each section on a new page
${style === 'screen' ? `\\newcommand\\sectionbreak{\\clearpage\\vspace*{2em}}` : ''}
${style === 'print' ? `\\newcommand\\sectionbreak{\\cleardoublepage\\vspace*{2em}}` : ''}

% table of contents
\\usepackage[hidelinks]{hyperref}
\\usepackage{titletoc}
\\contentsmargin{0em}
\\renewcommand\\contentspage{\\hspace{.2em}\\thecontentspage}
\\renewcommand\\contentslabel{}
\\dottedcontents{section}[0em]{}{}{0.5em}

% paragraphs
\\usepackage{parskip}
\\setlength{\\parskip}{0pt} % paragraph spacing
\\setlength{\\parindent}{1.5em} % indentation

% line height
\\linespread{1.15}

% change page numbering style
\\setlength{\\headheight}{15pt}
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

\\usepackage{lmodern}
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
\\maketitle

${content}

${style === 'print' ? `
\\newpage
\\thispagestyle{empty}
\\mbox{}
\\newpage
` : ''}

\\tableofcontents

\\end{document}`;
  // cSpell:enable
}

module.exports = { getContentOpf, getHtmlStructure, getTexStructure };