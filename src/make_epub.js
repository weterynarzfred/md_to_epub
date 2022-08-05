const fs = require('fs');
const cliProgress = require('cli-progress');

const { SOURCE_PATH, SETTINGS } = require('./constants');
const generateBookData = require('./functions/generateBookData');
const convertToPdf = require('./functions/convertToPdf');

function readInputFiles() {
  const isMarkdownFileRegex = new RegExp('\.md$');
  return files = fs.readdirSync(SOURCE_PATH)
    .filter(fileName => isMarkdownFileRegex.test(fileName))
    .map(fileName => ({
      fileName,
      markdown: fs.readFileSync(SOURCE_PATH + fileName, 'utf8'),
    }));
}

async function saveOutputFiles(bookData) {
  const makeEpub = require('./functions/makeEpub');

  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }

  const length = Object.keys(bookData).length;
  const multiBar = new cliProgress.MultiBar({
    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {filename}'
  }, cliProgress.Presets.shades_classic);

  const bar1 = multiBar.create(length, 0);
  let bar2;
  if (SETTINGS.convertToPdf) {
    bar2 = multiBar.create(length, 0);
  }

  let index = 0;
  for (const title in bookData) {
    await makeEpub(bookData[title]);
    bar1.increment(1, { filename: title });
    if (SETTINGS.convertToPdf) {
      const promise = convertToPdf(bookData[title], 'epub');
      promise.then(() => {
        index++;
        bar2.increment(1, { filename: title });
        if (index === length) {
          bar2.update(length, { filename: 'pdf files done' });
          multiBar.stop();
        }
      });
    }
  }
  bar1.update(length, { filename: 'epub files done' });
  if (!SETTINGS.convertToPdf) multiBar.stop();
}

const markdownFiles = readInputFiles();
const bookData = generateBookData(markdownFiles);
saveOutputFiles(bookData);