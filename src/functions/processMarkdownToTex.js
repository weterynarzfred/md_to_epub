const { SETTINGS } = require('../constants');

function processMarkdownToTex(data) {
  // data.markdownTex = data.raw.replaceAll(/[^a-zA-Z0-9 ]/g, '');
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


  data.markdownTex = data.markdownTex
    .replaceAll(/([_\^])/gm, '\\$1') // escape some characters
    .replaceAll(/^— /gm, '— ') // change spaces after em-dashes to constant width
    .replaceAll(/(?<= )([a-zA-Z—–\-]) /g, "$1~") // deal with orphans
    .replaceAll(
      /%%(.*?[^\/])%%/g,
      SETTINGS.stripComments ? "" : "$1"
    ); // mark comments


  if (SETTINGS.addEmptyLines) {
    data.markdownTex = data.markdownTex
      .replaceAll(/$\n/gm, '\n\n');
  }

  if (SETTINGS.replaceSeparators) {
    data.markdownTex = data.markdownTex
      .replaceAll(/(\*\*\*|---|___)\n*/g, `\\scenebreak\n`);
  }

  data.markdownTex = data.markdownTex
    .replaceAll(/<div class="pov">(.*?)<\/div>\n*/g, '\\pov{$1}\n');

  // cSpell:ignore subsubsection  
  // change headings to sections
  data.markdownTex = data.markdownTex
    .replaceAll(/^# (.*)/gm, '\\section{$1}')
    .replaceAll(/^## (.*)/gm, '\\subsection{$1}')
    .replaceAll(/^### (.*)/gm, '\\subsubsection{$1}')
    .replaceAll(/—/g, '\\mbox{---}'); // change em dashes to latex

  data.markdownTex = data.markdownTex
    .replaceAll(/\*(.*?)\*/g, '\\emph{$1}');

  return data.markdownTex;
}

module.exports = processMarkdownToTex;