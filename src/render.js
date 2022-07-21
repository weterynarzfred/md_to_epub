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

function saveOutputFiles(files) {
  const processMarkdown = require('./processMarkdown');
  const makeEpub = require('./makeEpub');

  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }

  for (const file of files) {
    const markdown = fs.readFileSync(SOURCE_PATH + file, 'utf8');
    data = processMarkdown(markdown, file);
    if (data) makeEpub(file.replace(/\.md$/, ''), data);
  }
}

function render() {
  const files = readInputFiles();
  saveOutputFiles(files);
}

module.exports = { render, INFO };