const { SETTINGS } = require('../constants');

function processMarkdownToTex(data) {
  data.markdownTex = data.raw;

  if (SETTINGS.stripCodeBlocks) {
    if (Array.isArray(SETTINGS.stripCodeBlocks)) {
      const regexp = new RegExp(
        "```(" +
        SETTINGS.stripCodeBlocks.join("|") +
        ")\\s*$.*?```", "gms"
      );
      data.markdownTex = data.markdownTex.replaceAll(regexp, '');
    } else {
      data.markdownTex = data.markdownTex.replaceAll(/```.*?```/gs, '');
    }
  }

  // cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ lettrine lraise lhang nindent findent realheight novskip loversize
  data.markdownTex = data.markdownTex
    .replaceAll(
      /(# .*?\n(\n|<div class="pov">.*?<\/div>)*)(\*)?(— |"|„)?([a-zA-Z0-9ęóąśłżźćńĘÓĄŚŁŻŹĆŃ])([a-zA-Z0-9ęóąśłżźćńĘÓĄŚŁŻŹĆŃ,.?!;:]*)(.*?)\n/g,
      (_match, m1, _m2, m3, _m4, m5, m6, m7) => `${m1}\\lettrine[lines=3, lraise=0, lhang=0, nindent=${['L'].includes(m5) ? 1.5 : 0.5}em, findent=${['W', 'T'].includes(m5) ? 0.2 : (['L'].includes(m5) ? -0.9 : 0.1)}em, realheight=true, grid=true, loversize=0, depth=${['J', 'Q'].includes(m5) ? 1 : 0}]{${m5}}{${m6}}${m3 === undefined ? '' : m3}${m7}\n\\zz\n`
    );

  data.markdownTex = data.markdownTex
    .replaceAll(/^— /gm, '— ') // change spaces after em-dashes to constant width
    .replaceAll(/(?<= )([a-zA-Z—–\-]) /g, "$1~") // deal with orphans
    .replaceAll(
      /%%(.*?[^\/])%%/g,
      SETTINGS.stripComments ? "" : "$1"
    ); // mark comments


  if (SETTINGS.addEmptyLines) {
    data.markdownTex = data.markdownTex
      .replaceAll(/(?<!\\zz)$\n/gm, '\n\n');
  }

  if (SETTINGS.replaceSeparators) {
    data.markdownTex = data.markdownTex
      .replaceAll(/(\*\*\*|---|___)\n*/g, `\\scenebreak\n`);
  }

  // cSpell:ignore sectionpov
  data.markdownTex = data.markdownTex
    .replaceAll(/(^#+ .*\n+)<div class="pov">(.*?)<\/div>\n*/gm, '$1\n\\sectionpov{$2}\n')
    .replaceAll(/<div class="pov">(.*?)<\/div>\n*/g, '\\pov{$1}\n');

  // cSpell:ignore subsubsection  
  // change headings to sections
  data.markdownTex = data.markdownTex
    .replaceAll(/^# (.*)/gm, '\\section{$1}')
    .replaceAll(/^## (.*)/gm, '\\subsection{$1}')
    .replaceAll(/^### (.*)/gm, '\\subsubsection{$1}')
    .replaceAll(/—/g, '\\mbox{---}') // change em dashes to latex
    .replaceAll(/([_\^])/g, '\\$1'); // escape some characters

  data.markdownTex = data.markdownTex
    .replaceAll(/\*(.*?)\*/g, '\\emph{$1}');

  return data.markdownTex;
}

module.exports = processMarkdownToTex;