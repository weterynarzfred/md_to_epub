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
  const bookData = [];

  for (const fileName of markdownFiles) {
    const markdown = fs.readFileSync(SOURCE_PATH + fileName, 'utf8');
    const data = processMarkdown(markdown, fileName);
    if (data) bookData.push(data);
  }

  return bookData;
}

function saveOutputFiles(bookData) {
  const makeEpub = require('./makeEpub');

  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }

  for (const book of bookData) {
    makeEpub(book);
  }
}

function render() {
  const markdownFiles = readInputFiles();
  const bookData = generateBookData(markdownFiles);
  saveOutputFiles(bookData);
}

module.exports = { render, INFO };