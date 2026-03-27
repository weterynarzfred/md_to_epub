const smartquotes = require('smartquotes');

const { SETTINGS } = require('../constants');
const Prism = require('prismjs');

require('prismjs/components/prism-markup');
require('prismjs/components/prism-css');
require('prismjs/components/prism-clike');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-tsx');
require('prismjs/components/prism-scss');
require('prismjs/components/prism-python');
require('prismjs/components/prism-c');
require('prismjs/components/prism-cpp');
require('prismjs/components/prism-java');
require('prismjs/components/prism-sql');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-powershell');
require('prismjs/components/prism-php');
require('prismjs/components/prism-ruby');
require('prismjs/components/prism-latex');

function escapeLaTeX(str) {
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/textbackslash\\{\\}/g, 'textbackslash{}')
    .replace(/\$/g, '\\$')
    .replace(/_/g, '\\_')
    .replace(/#([^ #])/g, '\\#$1')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%');
}

function tokenizeMarkdown(md) {
  const tokens = [];
  const codeBlockRegex = /(^|\r?\n)```([^\n\r`]*)[ \t]*\r?\n([\s\S]*?)\r?\n```(?=\r?\n|$)/g;
  let lastIndex = 0;

  for (const match of md.matchAll(codeBlockRegex)) {
    const prefix = match[1] ?? '';
    const start = match.index + prefix.length;
    const end = start + match[0].length - prefix.length;

    if (lastIndex < start)
      tokens.push({ type: 'text', content: md.slice(lastIndex, start) });

    tokens.push({
      type: 'codeBlock',
      language: match[2].trim().toLowerCase(),
      content: match[3],
    });
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

function mapMarkdownLanguageToPrism(language) {
  if (!language) return '';

  const aliases = {
    js: 'javascript',
    javascript: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    html: 'markup',
    xml: 'markup',
    svg: 'markup',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    py: 'python',
    python: 'python',
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    java: 'java',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    ps1: 'powershell',
    powershell: 'powershell',
    php: 'php',
    rb: 'ruby',
    ruby: 'ruby',
    tex: 'latex',
    latex: 'latex',
  };

  const normalized = language.toLowerCase();
  return aliases[normalized] ?? '';
}

const PRISM_TOKEN_COLORS = {
  comment: 'codeComment',
  prolog: 'codeComment',
  doctype: 'codeComment',
  cdata: 'codeComment',
  punctuation: 'codePunctuation',
  namespace: 'codePunctuation',
  property: 'codeProperty',
  tag: 'codeProperty',
  constant: 'codeConstant',
  symbol: 'codeConstant',
  deleted: 'codeDeleted',
  boolean: 'codeNumber',
  number: 'codeNumber',
  selector: 'codeSelector',
  'attr-name': 'codeSelector',
  string: 'codeString',
  char: 'codeString',
  builtin: 'codeString',
  inserted: 'codeInserted',
  operator: 'codeOperator',
  entity: 'codeOperator',
  url: 'codeOperator',
  atrule: 'codeKeyword',
  'attr-value': 'codeString',
  keyword: 'codeKeyword',
  function: 'codeFunction',
  'class-name': 'codeFunction',
  regex: 'codeRegex',
  important: 'codeImportant',
  variable: 'codeVariable',
};

const CODE_BREAK_MARKER = '\uE000';
const CODE_BACKSLASH_MARKER = '\uE001';
const CODE_BREAK_CHARS = new Set(['/', '\\', '.', '_', '-', ':', '?', '&', '#', '+', ',', ';', '@', '|', '(', ')', '[', ']']);
const FORCED_CODE_BREAK_RUN_LENGTH = 16;

function addCodeBreakHints(text) {
  let output = '';
  let nonWhitespaceRunLength = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = i < text.length - 1 ? text[i + 1] : '';
    const isWhitespace = /\s/u.test(char);

    output += char;

    if (isWhitespace) {
      if (char === ' ' && next !== '' && !/\s/u.test(next))
        output += CODE_BREAK_MARKER;
      nonWhitespaceRunLength = 0;
      continue;
    }

    nonWhitespaceRunLength += 1;
    const nextIsBreakable = next !== '' && !/\s/u.test(next);
    const breakAfterPunctuation = CODE_BREAK_CHARS.has(char) && nextIsBreakable;
    const breakLongUnbrokenRun = nonWhitespaceRunLength >= FORCED_CODE_BREAK_RUN_LENGTH && nextIsBreakable;

    if (breakAfterPunctuation || breakLongUnbrokenRun) {
      output += CODE_BREAK_MARKER;
      nonWhitespaceRunLength = 0;
    }
  }

  return output;
}

function flattenPrismTokens(tokens, activeTypes = [], result = []) {
  const list = Array.isArray(tokens) ? tokens : [tokens];
  for (const token of list) {
    if (typeof token === 'string') {
      result.push({ text: token, types: activeTypes });
      continue;
    }

    const aliases = Array.isArray(token.alias) ? token.alias : token.alias ? [token.alias] : [];
    const nextTypes = [...activeTypes, token.type, ...aliases];
    flattenPrismTokens(token.content, nextTypes, result);
  }
  return result;
}

function getPrismTokenColor(tokenTypes) {
  for (let i = tokenTypes.length - 1; i >= 0; i--) {
    const tokenType = tokenTypes[i];
    if (PRISM_TOKEN_COLORS[tokenType]) return PRISM_TOKEN_COLORS[tokenType];
  }
  return '';
}

function escapeLatexCodeText(text) {
  return text
    .replace(/\t/g, '  ')
    .replace(/\\/g, CODE_BACKSLASH_MARKER)
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/_/g, '\\_')
    .replace(/#/g, '\\#')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replaceAll(CODE_BACKSLASH_MARKER, '\\textbackslash{}');
}

function injectLatexBreakMarker(text) {
  return text.replaceAll(CODE_BREAK_MARKER, '\\hspace{0pt}');
}

function wrapSegmentWithColor(segment, color) {
  if (!color || segment.length === 0) return segment;
  return `\\textcolor{${color}}{${segment}}`;
}

function wrapWithColorPreservingNewlines(segment, color) {
  if (segment.length === 0) return '';

  const lines = segment.split('\n');
  let output = '';

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0)
      output += wrapSegmentWithColor(lines[i], color);

    if (i < lines.length - 1)
      output += '\n';
  }

  return output;
}

function renderHighlightedCode(flatTokens, withGlobalBreakHints) {
  if (!withGlobalBreakHints) {
    return flatTokens.map(token => {
      const escaped = escapeLatexCodeText(token.text);
      const color = getPrismTokenColor(token.types);
      return wrapWithColorPreservingNewlines(escaped, color);
    }).join('');
  }

  const chars = [];

  for (const token of flatTokens) {
    const color = getPrismTokenColor(token.types);
    for (const char of token.text)
      chars.push({ char, color });
  }

  const breakAfterChar = new Array(chars.length).fill(false);
  let nonWhitespaceRunLength = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i].char;
    const next = i < chars.length - 1 ? chars[i + 1].char : '';
    const isWhitespace = /\s/u.test(char);

    if (isWhitespace) {
      if (char === ' ' && next !== '' && !/\s/u.test(next))
        breakAfterChar[i] = true;
      nonWhitespaceRunLength = 0;
      continue;
    }

    nonWhitespaceRunLength += 1;
    const nextIsBreakable = next !== '' && !/\s/u.test(next);
    const breakAfterPunctuation = CODE_BREAK_CHARS.has(char) && nextIsBreakable;
    const breakLongUnbrokenRun = nonWhitespaceRunLength >= FORCED_CODE_BREAK_RUN_LENGTH && nextIsBreakable;

    if (breakAfterPunctuation || breakLongUnbrokenRun) {
      breakAfterChar[i] = true;
      nonWhitespaceRunLength = 0;
    }
  }

  let output = '';
  let buffer = '';
  let activeColor = null;

  const flush = () => {
    if (buffer.length === 0) return;
    output += wrapWithColorPreservingNewlines(escapeLatexCodeText(buffer), activeColor);
    buffer = '';
  };

  for (let i = 0; i < chars.length; i++) {
    const { char, color } = chars[i];
    if (color !== activeColor) {
      flush();
      activeColor = color;
    }

    buffer += char;

    if (breakAfterChar[i]) {
      flush();
      output += '\\hspace{0pt}';
    }
  }

  flush();
  return output;
}

function highlightCodeToLatex(code, language, withGlobalBreakHints) {
  const normalizedCode = code.replaceAll('\r\n', '\n');
  const prismLanguage = mapMarkdownLanguageToPrism(language);
  const grammar = prismLanguage ? Prism.languages[prismLanguage] : undefined;

  if (!grammar) {
    if (!withGlobalBreakHints) return escapeLatexCodeText(normalizedCode);
    return injectLatexBreakMarker(escapeLatexCodeText(addCodeBreakHints(normalizedCode)));
  }

  const tokens = Prism.tokenize(normalizedCode, grammar);
  const flatTokens = flattenPrismTokens(tokens);
  return renderHighlightedCode(flatTokens, withGlobalBreakHints);
}

function convertMarkdownLinks(text) {
  return text.replaceAll(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label, url) => `\\href{${url}}{${label}}`
  );
}

function convertMarkdownUnorderedLists(text) {
  const lines = text.split('\n');
  const output = [];
  let inList = false;

  const getListItemContent = line => {
    const match = line.match(/^\s*[-+*]\s+(.*)$/);
    return match ? match[1] : '';
  };

  const isListItemLine = line => /^\s*[-+*]\s+/.test(line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listItemContent = getListItemContent(line);

    if (listItemContent !== '') {
      if (!inList) {
        output.push('\\begin{itemize}');
        inList = true;
      }
      output.push(`\\item ${listItemContent}`);
      continue;
    }

    if (!inList) {
      output.push(line);
      continue;
    }

    if (line.trim() === '') {
      let nextNonEmpty = i + 1;
      while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '')
        nextNonEmpty += 1;

      if (nextNonEmpty < lines.length && isListItemLine(lines[nextNonEmpty]))
        continue;

      output.push('\\end{itemize}');
      inList = false;
      output.push(line);
      continue;
    }

    if (/^\s{2,}\S/.test(line) && output.length > 0 && output[output.length - 1].startsWith('\\item ')) {
      output[output.length - 1] += ` ${line.trim()}`;
      continue;
    }

    output.push('\\end{itemize}');
    inList = false;
    output.push(line);
  }

  if (inList)
    output.push('\\end{itemize}');

  return output.join('\n');
}

function makeInlineListings(content) {
  const escaped = escapeLatexCodeText(addCodeBreakHints(content));
  return `\\mdinlinecode{${injectLatexBreakMarker(escaped)}}`;
}

function preventQuoteLineBreaks(text) {
  // Keep quotes/backticks glued to adjacent non-whitespace even with xeCJK loaded.
  const protectedChars = new Set(["'", '"', '`', '‘', '’', '“', '”', '„', '‟', '‚', '‛']);
  let output = '';

  const quoteToLatex = char => {
    const raised = command => `{\\rmfamily\\raisebox{-0.08ex}{${command}}}`;

    switch (char) {
      case "'": return '{\\rmfamily\\textquotesingle{}}';
      case '"': return '{\\rmfamily\\textquotedbl{}}';
      case '`': return '{\\rmfamily\\textasciigrave{}}';
      case '‘': return '{\\rmfamily\\textquoteleft{}}';
      case '’': return '{\\rmfamily\\textquoteright{}}';
      case '“': return '{\\rmfamily\\textquotedblleft{}}';
      case '”': return '{\\rmfamily\\textquotedblright{}}';
      case '„': return '{\\rmfamily\\quotedblbase{}}';
      case '‟': return '{\\rmfamily\\textquotedblright{}}';
      case '‚': return '{\\rmfamily\\quotesinglbase{}}';
      case '‛': return '{\\rmfamily\\textquoteleft{}}';
      default: return char;
    }
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!protectedChars.has(char)) {
      output += char;
      continue;
    }

    const prev = i > 0 ? text[i - 1] : '';
    const next = i < text.length - 1 ? text[i + 1] : '';
    const touchesNonWhitespace =
      (prev !== '' && !/\s/u.test(prev)) ||
      (next !== '' && !/\s/u.test(next));
    const latinQuote = quoteToLatex(char);
    output += touchesNonWhitespace ? `\\mbox{${latinQuote}}` : latinQuote;
  }

  return output;
}

function processToken(token, previousToken) {
  switch (token.type) {
    case 'text':
      let result = escapeLaTeX(token.content);
      result = smartquotes(result);
      result = preventQuoteLineBreaks(result);

      // cSpell:ignore ęóąśłżźćńĘÓĄŚŁŻŹĆŃ lettrine lraise lhang nindent findent realheight novskip loversize
      if (SETTINGS.useDropCaps) {
        result = result
          .replaceAll(
            /(# .*?\n(\n|<div class="pov">.*?<\/div>)*|---\n+|\*\*\*\n+|___\n+)(\*)?(— |"|„)?([a-zA-Z0-9ęóąśłżźćńĘÓĄŚŁŻŹĆŃ])([a-zA-Z0-9ęóąśłżźćńĘÓĄŚŁŻŹĆŃ,.?!;:]*)(.*?)\n/g,
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

      result = convertMarkdownLinks(result);
      result = convertMarkdownUnorderedLists(result);

      if (previousToken?.type === 'codeBlock') {
        result = result.replace(/^\s+/, '');
        if (result.length > 0 && !result.startsWith('\\'))
          result = `\\noindent\\ignorespaces\n${result}`;
      }

      return result;
    case 'inlineCode':
      return makeInlineListings(token.content);
    case 'codeBlock':
      const rawLineCount = token.content.split(/\r?\n/).length;
      const keepTogether = rawLineCount <= 5;
      const highlightedCode = highlightCodeToLatex(token.content, token.language, false);
      const codeBlockBody = `\\begin{mdcodeblock}\n${highlightedCode}\n\\end{mdcodeblock}\n`;
      const codeBlockWithSpacing = `\\par\\addvspace{0.5\\baselineskip}\n${codeBlockBody}`;
      if (!keepTogether) return codeBlockWithSpacing;
      const needSpaceLines = Math.min(Math.max(rawLineCount + 4, 6), 10);
      return `\\begin{samepage}\n\\Needspace{${needSpaceLines}\\baselineskip}\n${codeBlockWithSpacing}\\end{samepage}\n`;
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
  data.markdownTex = tokens.map((token, index) => processToken(token, tokens[index - 1])).join('');
}

module.exports = processMarkdownToTex;
