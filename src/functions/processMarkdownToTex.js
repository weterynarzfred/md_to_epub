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

const ELLIPSIS = '\u2026';
const EM_DASH = '\u2014';
const EN_DASH = '\u2013';
const THREE_PER_EM_SPACE = '\u2004';
const CODE_BREAK_MARKER = '\uE000';
const CODE_BACKSLASH_MARKER = '\uE001';
const TEXT_BACKSLASH_MARKER = '\uE002';

const CODE_BREAK_CHARS = new Set([
  '/',
  '\\',
  '.',
  '_',
  '-',
  ':',
  '?',
  '&',
  '#',
  '+',
  ',',
  ';',
  '@',
  '|',
  '(',
  ')',
  '[',
  ']',
]);

const FORCED_CODE_BREAK_RUN_LENGTH = 16;
const SEPARATOR_LINE_REGEX = /^\s*(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})\s*$/gm;
const PRISM_TYPE_TO_LATEX_COLOR = {
  comment: 'codeGruvGray',
  prolog: 'codeGruvGray',
  doctype: 'codeGruvGray',
  cdata: 'codeGruvGray',
  punctuation: 'codeGruvGray',
  operator: 'codeGruvRed',
  namespace: 'codeGruvBlue',
  property: 'codeGruvBlue',
  tag: 'codeGruvBlue',
  'attr-name': 'codeGruvAqua',
  'attr-value': 'codeGruvGreen',
  boolean: 'codeGruvPurple',
  number: 'codeGruvPurple',
  constant: 'codeGruvPurple',
  symbol: 'codeGruvPurple',
  deleted: 'codeGruvRed',
  selector: 'codeGruvBlue',
  string: 'codeGruvGreen',
  char: 'codeGruvGreen',
  builtin: 'codeGruvOrange',
  inserted: 'codeGruvGreen',
  entity: 'codeGruvYellow',
  url: 'codeGruvAqua',
  atrule: 'codeGruvOrange',
  keyword: 'codeGruvRed',
  function: 'codeGruvBlue',
  'class-name': 'codeGruvYellow',
  regex: 'codeGruvAqua',
  important: 'codeGruvOrange',
  variable: 'codeGruvBlue',
  parameter: 'codeGruvOrange',
  interpolation: 'codeGruvAqua',
  'interpolation-punctuation': 'codeGruvRed',
  'template-punctuation': 'codeGruvRed',
  'template-string': 'codeGruvGreen',
};

function escapeLaTeX(str) {
  return str
    .replace(/\\/g, TEXT_BACKSLASH_MARKER)
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/_/g, '\\_')
    .replace(/#([^ #])/g, '\\#$1')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replaceAll(TEXT_BACKSLASH_MARKER, '\\textbackslash{}')
    .replace(/\u2192/g, '\\ensuremath{\\rightarrow}')
    .replace(/\u2190/g, '\\ensuremath{\\leftarrow}')
    .replace(/\u2191/g, '\\ensuremath{\\uparrow}')
    .replace(/\u2193/g, '\\ensuremath{\\downarrow}');
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

  return aliases[language.toLowerCase()] ?? '';
}

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
    const breakLongRun = nonWhitespaceRunLength >= FORCED_CODE_BREAK_RUN_LENGTH && nextIsBreakable;

    if (breakAfterPunctuation || breakLongRun) {
      output += CODE_BREAK_MARKER;
      nonWhitespaceRunLength = 0;
    }
  }

  return output;
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
    .replaceAll(CODE_BACKSLASH_MARKER, '\\textbackslash{}')
    .replace(/\u2192/g, '\\ensuremath{\\rightarrow}')
    .replace(/\u2190/g, '\\ensuremath{\\leftarrow}')
    .replace(/\u2191/g, '\\ensuremath{\\uparrow}')
    .replace(/\u2193/g, '\\ensuremath{\\downarrow}');
}

function injectLatexBreakMarker(text) {
  return text.replaceAll(CODE_BREAK_MARKER, '\\hspace{0pt}');
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

function wrapWithColorPreservingNewlines(segment, color) {
  if (segment.length === 0) return '';
  if (!color) return segment;

  const lines = segment.split('\n');
  return lines
    .map(line => (line.length === 0 ? '' : `\\textcolor{${color}}{${line}}`))
    .join('\n');
}

function getPrismTokenColor(types) {
  for (let i = types.length - 1; i >= 0; i--) {
    const color = PRISM_TYPE_TO_LATEX_COLOR[types[i]];
    if (color) return color;
  }
  return '';
}

function highlightCodeToLatex(code, language) {
  const normalizedCode = code.replaceAll('\r\n', '\n');
  const prismLanguage = mapMarkdownLanguageToPrism(language);
  const grammar = prismLanguage ? Prism.languages[prismLanguage] : undefined;
  const plain = injectLatexBreakMarker(escapeLatexCodeText(addCodeBreakHints(normalizedCode)));

  if (!grammar) return plain;

  const tokens = Prism.tokenize(normalizedCode, grammar);
  const flatTokens = flattenPrismTokens(tokens);

  return flatTokens.map(token => {
    const escaped = injectLatexBreakMarker(escapeLatexCodeText(addCodeBreakHints(token.text)));
    const color = getPrismTokenColor(token.types);
    return wrapWithColorPreservingNewlines(escaped, color);
  }).join('');
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

function convertMarkdownOrderedLists(text) {
  const lines = text.split('\n');
  const output = [];
  let inList = false;

  const getListItemContent = line => {
    const match = line.match(/^\s*\d+\.\s+(.*)$/);
    return match ? match[1] : '';
  };

  const isListItemLine = line => /^\s*\d+\.\s+/.test(line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listItemContent = getListItemContent(line);

    if (listItemContent !== '') {
      if (!inList) {
        output.push('\\begin{enumerate}');
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

      output.push('\\end{enumerate}');
      inList = false;
      output.push(line);
      continue;
    }

    if (/^\s{2,}\S/.test(line) && output.length > 0 && output[output.length - 1].startsWith('\\item ')) {
      output[output.length - 1] += ` ${line.trim()}`;
      continue;
    }

    output.push('\\end{enumerate}');
    inList = false;
    output.push(line);
  }

  if (inList)
    output.push('\\end{enumerate}');

  return output.join('\n');
}

function makeInlineListings(content) {
  const escaped = escapeLatexCodeText(addCodeBreakHints(content));
  return `\\mdinlinecode{${injectLatexBreakMarker(escaped)}}`;
}

function enforceNoIndentAfterPattern(text, pattern) {
  const startsWithBlockCommand = rest => {
    const trimmed = rest.replace(/^\s+/, '');
    return /^\\(?:section|subsection|subsubsection|begin|end|pov|sectionpov|scenebreak|clearpage|tableofcontents|item|par)\b/.test(trimmed);
  };

  let result = '';
  let lastIndex = 0;
  let match;
  pattern.lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    const endIndex = pattern.lastIndex;
    result += text.slice(lastIndex, endIndex);

    const rest = text.slice(endIndex);
    const nextNonWhitespace = rest.match(/\S/);
    if (nextNonWhitespace && !startsWithBlockCommand(rest))
      result += '\n\\noindent\\ignorespaces\n';

    lastIndex = endIndex;
  }

  result += text.slice(lastIndex);
  return result;
}

function normalizeSeparatorLines(markdown) {
  return markdown.replace(SEPARATOR_LINE_REGEX, '***');
}

function normalizeQuotesForTex(text) {
  let result = text
    .replace(/\u2018/g, '\\textquoteleft{}')
    .replace(/\u2019/g, '\\textquoteright{}')
    .replace(/\u201A/g, '\\quotesinglbase{}')
    .replace(/\u201C/g, '\\textquotedblleft{}')
    .replace(/\u201D/g, '\\textquotedblright{}')
    .replace(/\u201E/g, '\\quotedblbase{}');

  // Keep contractions together even when CJK settings are active.
  result = result.replace(/(\p{L})\\textquoteright\{\}(\p{L})/gu, '$1\\mbox{\\textquoteright{}}$2');
  result = result.replace(/(\p{L})\\textquoteleft\{\}(\p{L})/gu, '$1\\mbox{\\textquoteleft{}}$2');

  return result;
}

function processTextToken(content, previousToken) {
  let result = escapeLaTeX(content);

  result = result
    .replaceAll(/(^#+ .*\n+)<div class="pov">(.*?)<\/div>\n*/gm, '$1\n\\sectionpov{$2}\n')
    .replaceAll(/<div class="pov">(.*?)<\/div>\n*/g, '\\pov{$1}');

  result = smartquotes(result);
  result = normalizeQuotesForTex(result);
  result = result.replaceAll(/\.\.\./g, ELLIPSIS);
  result = result.replace(/[\u2026\u22EF]/g, '\\ldots{}');
  result = result.replaceAll(new RegExp(`^${EM_DASH} `, 'gm'), `${EM_DASH}${THREE_PER_EM_SPACE}`);
  result = result.replaceAll(/(?<= )([A-Za-z\u2014\u2013-]) /g, '$1~');
  result = result.replaceAll(/%%(.*?[^/])%%/g, SETTINGS.stripComments ? '' : '$1');

  if (SETTINGS.replaceSeparators)
    result = normalizeSeparatorLines(result);

  if (SETTINGS.addEmptyLines)
    result = result.replaceAll(/\n/g, '\n\n');

  if (SETTINGS.replaceSeparators)
    result = result.replaceAll(/^\s*\*\*\*\s*$/gm, '\\scenebreak');

  result = result
    .replaceAll(/^####+ (.*)/gm, '\\subsubsection{$1}')
    .replaceAll(/^### (.*)/gm, '\\subsubsection{$1}')
    .replaceAll(/^## (.*)/gm, '\\subsection{$1}')
    .replaceAll(/^# (.*)/gm, '\\section{$1}')
    .replaceAll(/\^/g, '\\textasciicircum{}')
    .replaceAll(/(?<!\*)\*\*\*([^\n*]+)\*\*\*(?!\*)/g, '\\textbf{\\emph{$1}}')
    .replaceAll(/(?<!\*)\*\*([^\n*]+)\*\*(?!\*)/g, '\\textbf{$1}')
    .replaceAll(/\\_\\_([^\n]+?)\\_\\_/g, '\\textbf{$1}')
    .replaceAll(/(?<!\*)\*([^\n*]+)\*(?!\*)/g, '\\emph{$1}')
    .replaceAll(EN_DASH, '--')
    .replaceAll(EM_DASH, '---');

  result = convertMarkdownLinks(result);
  result = convertMarkdownOrderedLists(result);
  result = convertMarkdownUnorderedLists(result);
  result = enforceNoIndentAfterPattern(result, /\\(?:sectionpov|pov)\{[^}\n]*\}\s*/g);
  result = enforceNoIndentAfterPattern(result, /\\end\{(?:itemize|enumerate)\}\s*/g);

  if (previousToken?.type === 'codeBlock') {
    result = result.replace(/^\s+/, '');
    if (result.length > 0 && !result.startsWith('\\'))
      result = `\\noindent\\ignorespaces\n${result}`;
  }

  return result;
}

function processToken(token, previousToken) {
  switch (token.type) {
    case 'text':
      return processTextToken(token.content, previousToken);
    case 'inlineCode':
      return makeInlineListings(token.content);
    case 'codeBlock': {
      const highlightedCode = highlightCodeToLatex(token.content, token.language);
      return `\\par\\addvspace{0.5\\baselineskip}\n\\begin{mdcodeblock}\n${highlightedCode}\n\\end{mdcodeblock}\n`;
    }
    default:
      return '';
  }
}

function processMarkdownToTex(data) {
  data.markdownTex = data.raw;

  if (SETTINGS.stripCodeBlocks) {
    if (Array.isArray(SETTINGS.stripCodeBlocks)) {
      const regexp = new RegExp(
        '```(' +
        SETTINGS.stripCodeBlocks.join('|') +
        ')\\s*$.*?```',
        'gms'
      );
      data.markdownTex = data.markdownTex.replaceAll(regexp, '');
    } else {
      data.markdownTex = data.markdownTex.replaceAll(/```.*?```/gs, '');
    }
  }

  const tokens = tokenizeMarkdown(data.markdownTex);
  data.markdownTex = tokens
    .map((token, index) => processToken(token, tokens[index - 1]))
    .join('');
}

module.exports = processMarkdownToTex;
