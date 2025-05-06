const fs = require('fs');
const cliProgress = require('cli-progress');

const { SOURCE_PATH, SETTINGS } = require('./constants');
const generateBookData = require('./functions/generateBookData');
const makeEpub = require('./functions/makeEpub');
const makePdf = require('./functions/makePdf');
const sanitizeFilename = require("./functions/sanitizeFilename");

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
  if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
  }

  const titles = Object.keys(bookData);
  const length = titles.length;

  const multiBar = new cliProgress.MultiBar(
    { format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | {filename}' },
    cliProgress.Presets.shades_classic
  );

  const barEpub = multiBar.create(length, 0);
  let barPdf;
  if (SETTINGS.convertToPdf) barPdf = multiBar.create(length, 0);

  const work = titles.map(title => {

    bookData[title].fileName = (bookData[title].isStoryGroup ? '_' : '') +
      sanitizeFilename(bookData[title].title);

    return new Promise((resolve) => {

      if (bookData[title].isStoryGroup) {
        fs.writeFile('./output/' + bookData[title].fileName + '.md', bookData[title].sections.map(section => section.markdown).join("\n\n***\n\n"), () => { });
      }

      makeEpub(bookData[title])
        .then(() => {
          barEpub.increment(1, { filename: title });
          if (!SETTINGS.convertToPdf) resolve();
        });

      if (SETTINGS.convertToPdf) {
        makePdf(bookData[title])
          .then(() => {
            barPdf.increment(1, { filename: title });
            resolve();
          });
      }
    });
  });

  await Promise.all(work);

  barEpub.update(length, { filename: 'epub files done' });
  if (SETTINGS.convertToPdf) {
    barPdf.update(length, { filename: 'pdf files done' });
  }
  multiBar.stop();
}


const markdownFiles = readInputFiles();
const bookData = generateBookData(markdownFiles);
saveOutputFiles(bookData);
