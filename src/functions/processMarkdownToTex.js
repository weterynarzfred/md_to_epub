const smartquotes = require('smartquotes');

const { SETTINGS } = require('../constants');

function escapeLaTeX(str) {
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%');
}

function tokenizeMarkdown(md) {
  const tokens = [];
  const codeBlockRegex = /```([\s\S]*?)```/g;
  let lastIndex = 0;

  for (const match of md.matchAll(codeBlockRegex)) {
    const start = match.index;
    const end = start + match[0].length;

    if (lastIndex < start)
      tokens.push({ type: 'text', content: md.slice(lastIndex, start) });

    tokens.push({ type: 'codeBlock', content: match[1] });
    lastIndex = end;
  }

  if (lastIndex < md.length)
    tokens.push({ type: 'text', content: md.slice(lastIndex) });

  return tokens.flatMap(token => {
    if (token.type !== 'text') return [token];

    const inlineSplit = token.content.split(/(`[^`]+`)/g);
    return inlineSplit.map(part => {
      if (part.startsWith('`') && part.endsWith('`'))
        return { type: 'inlineCode', content: part.slice(1, -1) };

      return { type: 'text', content: part };
    });
  });
}

function processToken(token) {
  switch (token.type) {
    case 'text':
      let result = escapeLaTeX(token.content);
      result = smartquotes(result);

      // cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ lettrine lraise lhang nindent findent realheight novskip loversize
      if (SETTINGS.useDropCaps) {
        result = result
          .replaceAll(
            /(# .*?\n(\n|<div class="pov">.*?<\/div>)*)(\*)?(— |"|„)?([a-zA-Z0-9ęóąśłżźćńĘÓĄŚŁŻŹĆŃ])([a-zA-Z0-9ęóąśłżźćńĘÓĄŚŁŻŹĆŃ,.?!;:]*)(.*?)\n/g,
            (_match, m1, _m2, m3, _m4, m5, m6, m7) => `${m1}\\lettrine[lines=3, lraise=0, lhang=0, nindent=${['L'].includes(m5) ? 1.5 : 0.5}em, findent=${['W', 'T'].includes(m5) ? 0.2 : (['L'].includes(m5) ? -0.9 : 0.1)}em, realheight=true, grid=true, loversize=0, depth=${['J', 'Q'].includes(m5) ? 1 : 0}]{${m5}}{${m6}}${m3 === undefined ? '' : m3}${m7}\n\\zz\n`
          );
      }

      result = result
        .replaceAll(/^— /gm, '— ') // change spaces after em-dashes to constant width
        .replaceAll(/(?<= )([a-zA-Z—–\-]) /g, "$1~") // deal with orphans
        .replaceAll(
          /%%(.*?[^\/])%%/g,
          SETTINGS.stripComments ? "" : "$1"
        ); // mark comments

      if (SETTINGS.addEmptyLines)
        result = result
          .replaceAll(/(?<!\\zz)$\n/gm, '\n\n');

      if (SETTINGS.replaceSeparators)
        result = result
          .replaceAll(/(\*\*\*|---|___)\n*/g, `\\scenebreak\n`);

      // cSpell:ignore sectionpov
      result = result
        .replaceAll(/(^#+ .*\n+)<div class="pov">(.*?)<\/div>\n*/gm, '$1\n\\sectionpov{$2}\n')
        .replaceAll(/<div class="pov">(.*?)<\/div>\n*/g, '\\pov{$1}\n');

      // cSpell:ignore subsubsection  
      // change headings to sections
      result = result
        .replaceAll(/^# (.*)/gm, '\\section{$1}')
        .replaceAll(/^## (.*)/gm, '\\subsection{$1}')
        .replaceAll(/^###+ (.*)/gm, '\\subsubsection{$1}')
        .replaceAll(/–/g, '\\mbox{--}') // change en dashes to latex
        .replaceAll(/—/g, '\\mbox{---}') // change em dashes to latex
        .replaceAll(/\.\.\./g, '…'); // change three dots to an ellipsis character

      result = result
        .replaceAll(/\*(.*?)\*/g, '\\emph{$1}');

      return result;
    case 'inlineCode':
      return `\\texttt{${escapeLaTeX(token.content)}}`;
    case 'codeBlock':
      return `\\begin{verbatim}\n${token.content}\n\\end{verbatim}`;
  }
}

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
    } else data.markdownTex = data.markdownTex.replaceAll(/```.*?```/gs, '');
  }

  const tokens = tokenizeMarkdown(data.markdownTex);
  data.markdownTex = tokens.map(processToken).join('');
}

module.exports = processMarkdownToTex;
