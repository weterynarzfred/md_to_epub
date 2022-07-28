const fs = require('fs');

const { SOURCE_PATH } = require('./constants');
const generateBookData = require('./functions/generateBookData');

function readInputFiles() {
  const isMarkdownFileRegex = new RegExp('\.md$');
  return files = fs.readdirSync(SOURCE_PATH)
    .filter(fileName => isMarkdownFileRegex.test(fileName))
    .map(fileName => ({
      fileName,
      markdown: fs.readFileSync(SOURCE_PATH + fileName, 'utf8'),
    }));
}

function saveOutputFiles(bookData) {
  const makeEpub = require('./functions/makeEpub');

  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }

  for (const title in bookData) {
    makeEpub(bookData[title]);
  }
}

const markdownFiles = readInputFiles();
const bookData = generateBookData(markdownFiles);
saveOutputFiles(bookData);