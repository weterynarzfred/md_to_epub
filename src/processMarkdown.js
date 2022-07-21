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

function preprocessMarkdown(markdown) {
  markdown = markdown
    .replaceAll(/^(#+) /gm, '$1# ') // increase heading depth
    .replaceAll(/^— /gm, '—&#x2004;') // change spaces after em-dashes to constant width
    .replaceAll(/ ([a-zA-Z—–-]) /g, " $1&nbsp;") // orphans
    .replaceAll(/$\n/gm, '\n\n'); // add empty space between paragraphs

  try {
    const hyphen = require(`hyphen/${params.language}`);
    markdown = hyphen.hyphenateHTMLSync(markdown);
  } catch (e) { }

  return markdown;
}

function processMarkdown(inputMarkdown) {
  const { params, markdown } = separateParams(inputMarkdown);
  if (params.tag !== 'prose') return false;
  html = md.render(preprocessMarkdown(markdown));

  return {
    params,
    html,
  };
}

module.exports = processMarkdown;