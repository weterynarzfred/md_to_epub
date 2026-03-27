const smartquotes = require('smartquotes');

const { SETTINGS } = require('../constants');

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({
  html: true,
  typographer: true,
});

const ELLIPSIS = '\u2026';
const EM_DASH = '\u2014';
const EN_DASH = '\u2013';
const THREE_PER_EM_SPACE = '\u2004';
const SEPARATOR_LINE_REGEX = /^\s*(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})\s*$/;

function parseGtParams(markdown, params) {
  const lines = markdown.split(/\r?\n/);
  let index = 0;
  let parsedAny = false;

  while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
    parsedAny = true;
    const content = lines[index].replace(/^\s*>\s?/, '');
    if (content.startsWith('#')) {
      params.tag = content.slice(1).trim();
    } else {
      const [rawKey, ...rawValueParts] = content.split(/::\s*/);
      if (rawValueParts.length > 0) {
        const key = rawKey?.trim();
        const value = rawValueParts.join('::').trim();
        if (key) params[key] = value;
      }
    }
    index += 1;
  }

  if (!parsedAny) return markdown;

  while (index < lines.length && lines[index].trim() === '')
    index += 1;

  return lines.slice(index).join('\n');
}

function parseFrontMatter(markdown, params) {
  const frontMatterMatch = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?/);
  if (!frontMatterMatch) return markdown;

  const frontMatter = frontMatterMatch[1];
  for (const line of frontMatter.split(/\r?\n/)) {
    const kvMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (!kvMatch) continue;
    const key = kvMatch[1].trim();
    const value = kvMatch[2].trim();
    if (key) params[key] = value;
  }

  return markdown.slice(frontMatterMatch[0].length);
}

function separateParams(inputMarkdown) {
  const params = {};
  let markdown = inputMarkdown;

  markdown = parseGtParams(markdown, params);
  markdown = parseFrontMatter(markdown, params);

  return { markdown, params };
}

function normalizeSeparatorLines(markdown) {
  return markdown
    .split(/\r?\n/)
    .map(line => (SEPARATOR_LINE_REGEX.test(line) ? '***' : line))
    .join('\n');
}

function preprocessMarkdown(data) {
  data.raw = data.markdown;

  if (SETTINGS.stripCodeBlocks) {
    if (Array.isArray(SETTINGS.stripCodeBlocks)) {
      const regexp = new RegExp(
        '```(' +
        SETTINGS.stripCodeBlocks.join('|') +
        ')\\s*$.*?```',
        'gms'
      );
      data.markdown = data.markdown.replaceAll(regexp, '');
    } else {
      data.markdown = data.markdown.replaceAll(/```.*?```/gs, '');
    }
  }

  if (SETTINGS.stripComments)
    data.markdown = data.markdown.replaceAll(/%%(.*?[^/])%%/g, '');

  if (![undefined, ''].includes(data.params?.story)) {
    // Reserve top-level heading depth for the generated story title.
    data.markdown = data.markdown.replaceAll(/^# /gm, '## ');
  }

  data.markdown = data.markdown
    .replaceAll(/\.\.\./g, ELLIPSIS)
    .replace(/\u22EF/g, ELLIPSIS);
  data.markdown = smartquotes(data.markdown);

  let htmlMarkdown = data.markdown;

  htmlMarkdown = htmlMarkdown
    .replaceAll(new RegExp(`^${EM_DASH} `, 'gm'), `${EM_DASH}${THREE_PER_EM_SPACE}`)
    .replaceAll(/(?<= )([A-Za-z\u2014\u2013-]) /g, '$1&nbsp;')
    .replaceAll(
      /%%(.*?[^/])%%/g,
      SETTINGS.stripComments ? '' : '<span class="comment">$1</span>'
    );

  if (SETTINGS.addEmptyLines)
    htmlMarkdown = htmlMarkdown.replaceAll(/$\n/gm, '\n\n');

  if (SETTINGS.hyphenate) {
    const languages = {
      pl: 'pl',
      en: 'en',
      polish: 'pl',
      english: 'en',
      Polish: 'pl',
      English: 'en',
    };
    const lang = [undefined, ''].includes(data.params?.language)
      ? SETTINGS.language
      : languages[data.params.language];
    try {
      const hyphen = require(`hyphen/${lang}`);
      htmlMarkdown = hyphen.hyphenateHTMLSync(htmlMarkdown);
    } catch (_error) {
      console.error(`error with hyphenation, language: ${lang}`);
    }
  }

  if (SETTINGS.replaceSeparators) {
    data.markdown = normalizeSeparatorLines(data.markdown);
    htmlMarkdown = normalizeSeparatorLines(htmlMarkdown);
    htmlMarkdown = htmlMarkdown.replaceAll(
      /^\*\*\*\n+([^\n]*)/gm,
      (_match, nextLine) => `
<div class="no-page-break">
  <div class="separator">
    *<span>*</span>*
  </div>
  ${md.render(nextLine)}
</div>
  `
    );
  }

  htmlMarkdown = htmlMarkdown.replaceAll(
    /(<div class="pov">.*?<\/div>)\n+([^\n]*)/g,
    (_match, pov, nextLine) => `
<div class="no-page-break">
  ${pov}
  ${md.render(nextLine)}
</div>
  `
  );

  data.html = md.render(htmlMarkdown);
}

function processMarkdown(inputMarkdown, fileName) {
  const data = SETTINGS.parseGtAsProps
    ? separateParams(inputMarkdown)
    : { markdown: inputMarkdown, params: {} };

  if (SETTINGS.filter !== undefined && !SETTINGS.filter(data.params, fileName))
    return false;

  preprocessMarkdown(data);
  data.title = fileName.replace(/\.md$/, '');
  return data;
}

module.exports = processMarkdown;
