const MarkdownIt = require('markdown-it'),
  md = new MarkdownIt();

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

function getPreprocessedMarkdown(data) {
  data.markdown = data.markdown
    .replaceAll(/^(#+) /gm, '$1# ') // increase heading depth
    .replaceAll(/^— /gm, '—&#x2004;') // change spaces after em-dashes to constant width
    .replaceAll(/ ([a-zA-Z—–-]) /g, " $1&nbsp;") // orphans
    .replaceAll(/$\n/gm, '\n\n'); // add empty space between paragraphs

  if (![undefined, ''].includes(data.params.language)) {
    try {
      const hyphen = require(`hyphen/${data.params.language}`);
      data.markdown = hyphen.hyphenateHTMLSync(data.markdown);
    } catch (e) { console.error(e); }
  }

  return data.markdown;
}

function processMarkdown(inputMarkdown, fileName) {
  const data = separateParams(inputMarkdown);
  if (data.params.tag !== 'prose') return false;
  data.html = md.render(getPreprocessedMarkdown(data));
  data.title = fileName.replace(/\.md$/, '');

  return data;
}

module.exports = processMarkdown;