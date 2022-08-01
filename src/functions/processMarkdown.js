const { SETTINGS } = require('../constants');

const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt({
    html: true,
    typographer: true,
  });

function separateParams(inputMarkdown) {
  const params = {};
  const markdown = inputMarkdown
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

  return {
    markdown,
    params,
  };
}

function preprocessMarkdown(data) {
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

  data.markdown = data.markdown
    .replaceAll(/^— /gm, '—&#x2004;') // change spaces after em-dashes to constant width
    .replaceAll(/ ([a-zA-Z—–\-]) /g, " $1&nbsp;"); // deal with orphans

  if (SETTINGS.addEmptyLines) {
    data.markdown = data.markdown
      .replaceAll(/$\n/gm, '\n\n');
  }

  if (![undefined, ''].includes(data.params?.story)) {
    data.markdown = data.markdown
      .replaceAll(/^# /gm, '## '); // increase first heading depth
  }

  if (SETTINGS.hyphenate) {
    const lang = [undefined, ''].includes(data.params?.language) ? SETTINGS.language : data.params.language;
    try {
      const hyphen = require(`hyphen/${lang}`);
      data.markdown = hyphen.hyphenateHTMLSync(data.markdown);
    } catch (e) {
      console.error(`error with hyphenation, language: ${lang}`);
    }
  }

  if (SETTINGS.replaceSeparators) {
    data.markdown = data.markdown
      .replaceAll(/(\*\*\*|---|___)/g, `<div class="separator">
  *<span>*</span>*
  </div>`);
  }

  return data.markdown;
}

function processMarkdown(inputMarkdown, fileName) {
  const data = SETTINGS.parseGtAsProps ?
    separateParams(inputMarkdown) :
    { markdown: inputMarkdown, props: {} };
  if (SETTINGS.filter !== undefined && !SETTINGS.filter(data)) return false;
  data.html = md.render(preprocessMarkdown(data));
  data.title = fileName.replace(/\.md$/, '');

  return data;
}

module.exports = processMarkdown;