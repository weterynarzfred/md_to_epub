const fs = require('fs');

const SOURCE_PATH = "P:/pisanie/pisanie/";
const INFO = {
  author: 'test author',
  publisher: 'test publisher',
};

function readInputFiles() {
  const isMarkdownFileRegex = new RegExp('\.md$');
  return files = fs.readdirSync(SOURCE_PATH)
    .filter(file => isMarkdownFileRegex.test(file));
}

function generateBookData(markdownFiles) {
  const processMarkdown = require('./processMarkdown');
  const bookData = {};

  for (const fileName of markdownFiles) {
    const markdown = fs.readFileSync(SOURCE_PATH + fileName, 'utf8');
    const data = processMarkdown(markdown, fileName);
    if (data) {
      const isStoryGroup = ![undefined, ''].includes(data.params.story);
      const title = isStoryGroup ? data.params.story.replaceAll(/[\[\]]/g, '') : data.title;
      if (bookData[title] === undefined) bookData[title] = {
        title,
        isStoryGroup,
        language: data.params.language,
        sections: [],
      };
      bookData[title].sections.push(data);
    }
  }

  return bookData;
}

function saveOutputFiles(bookData) {
  const makeEpub = require('./makeEpub');

  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }

  for (const title in bookData) {
    bookData[title].sections.sort((a, b) =>
      (a.params.order ?? a.title).localeCompare(b.params.order ?? b.title));

    makeEpub(bookData[title]);
  }
}

function render() {
  const markdownFiles = readInputFiles();
  const bookData = generateBookData(markdownFiles);
  saveOutputFiles(bookData);
}

module.exports = { render, INFO };