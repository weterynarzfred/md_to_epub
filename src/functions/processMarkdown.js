const smartquotes = require('smartquotes');

const { SETTINGS } = require('../constants');

const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt({
    html: true,
    typographer: true,
  });

function separateParams(inputMarkdown) {
  const params = {};
  let markdown = inputMarkdown
    .replaceAll(/^> *(.*)$\n/gm, (_match, group_1) => {
      if (group_1?.[0] === '#') {
        params['tag'] = group_1.slice(1).replace(/ +$/, '');
      } else {
        const groupSplit = group_1.split(/:: */);
        const key = groupSplit.shift();
        const value = groupSplit.join(' ');
        if (value !== undefined) {
          params[key] = value;
        }
      }
      return '';
    });

  markdown = markdown.replace(/^\s*---(.+)---/s, (_match, group_1) => {
    const matches = group_1.match(/^.+:\s*(.+)$/gm);
    matches.forEach(match => {
      const [key, value] = match.split(/:\s*/);
      params[key] = value;
    });

    return '';
  });

  return {
    markdown,
    params,
  };
}

function preprocessMarkdown(data) {
  data.raw = data.markdown;

  if (SETTINGS.stripCodeBlocks) {
    if (Array.isArray(SETTINGS.stripCodeBlocks)) {
      const regexp = new RegExp(
        "```(" +
        SETTINGS.stripCodeBlocks.join("|") +
        ")\\s*$.*?```", "gms"
      );
      data.markdown = data.markdown.replaceAll(regexp, '');
    } else {
      data.markdown = data.markdown.replaceAll(/```.*?```/gs, '');
    }
  }

  if (SETTINGS.stripComments)
    data.markdown = data.markdown.replaceAll(/%%(.*?[^\/])%%/g, "");

  if (![undefined, ''].includes(data.params?.story)) {
    data.markdown = data.markdown
      .replaceAll(/^# /gm, '## '); // increase first heading depth to allow the insertion of a story title
  }

  data.markdown = smartquotes(data.markdown);

  data.html = data.markdown;

  data.html = data.html
    .replaceAll(/^— /gm, '—&#x2004;') // change spaces after em-dashes to constant width
    .replaceAll(/(?<= )([a-zA-Z—–\-]) /g, "$1&nbsp;") // deal with orphans
    .replaceAll(
      /%%(.*?[^\/])%%/g,
      SETTINGS.stripComments ? "" : "<span class=\"comment\">$1</span>"
    ); // mark comments

  if (SETTINGS.addEmptyLines)
    data.html = data.html
      .replaceAll(/$\n/gm, '\n\n');


  if (SETTINGS.hyphenate) {
    const languages = {
      pl: 'pl',
      en: 'en',
      polish: 'pl',
      english: 'en',
      Polish: 'pl',
      English: 'en',
    };
    const lang = [undefined, ''].includes(data.params?.language) ? SETTINGS.language : languages[data.params.language];
    try {
      const hyphen = require(`hyphen/${lang}`);
      data.html = hyphen.hyphenateHTMLSync(data.html);
    } catch (e) {
      console.error(`error with hyphenation, language: ${lang}`);
    }
  }

  if (SETTINGS.replaceSeparators) {
    data.markdown = data.markdown.replaceAll(/(---|___)/g, "***");
    data.html = data.html
      .replaceAll(/(\*\*\*|---|___)\n+([^\n]*)/g, (_match, _g1, g2) => `
<div class="no-page-break">
  <div class="separator">
    *<span>*</span>*
  </div>
  ${md.render(g2)}
</div>
  `);
  }

  data.html = data.html
    .replaceAll(/(<div class="pov">.*?<\/div>)\n+([^\n]*)/g, (_match, g1, g2) => `
<div class="no-page-break">
  ${g1}
  ${md.render(g2)}
</div>
  `);

  data.html = md.render(data.html);
}

function processMarkdown(inputMarkdown, fileName) {
  const data = SETTINGS.parseGtAsProps ?
    separateParams(inputMarkdown) :
    { markdown: inputMarkdown, props: {} };
  if (SETTINGS.filter !== undefined && !SETTINGS.filter(data.params, fileName)) return false;
  preprocessMarkdown(data);
  data.title = fileName.replace(/\.md$/, '');

  return data;
}

module.exports = processMarkdown;
