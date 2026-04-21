const fs = require('fs');
const cliProgress = require('cli-progress');
const path = require("path");

const { SOURCE_PATH, SETTINGS } = require('./constants');
const generateBookData = require('./functions/generateBookData');
const makeEpub = require('./functions/makeEpub');
const makePdf = require('./functions/makePdf');
const sanitizeFilename = require("./functions/sanitizeFilename");

function readInputFiles() {
  const isMarkdownFileRegex = /\.md$/;

  const readDir = dirPath => fs.readdirSync(dirPath, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && SETTINGS.includeSubfolders) return readDir(fullPath);
      if (entry.isFile() && isMarkdownFileRegex.test(entry.name)) {
        return [{
          fileName: path.relative(SOURCE_PATH, fullPath),
          markdown: fs.readFileSync(fullPath, 'utf8'),
        }];
      }
      return [];
    });

  return readDir(SOURCE_PATH);
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

  const work = titles.map(async title => {
    bookData[title].fileName = (bookData[title].isStoryGroup ? '_' : '') +
      sanitizeFilename(bookData[title].title);

    if (bookData[title].isStoryGroup) {
      fs.writeFile('./output/' + bookData[title].fileName + '.md', bookData[title].sections.map(section => section.markdown).join("\n\n***\n\n"), () => { });
    }

    try {
      await makeEpub(bookData[title]);
    } catch (error) {
      console.error(`EPUB failed for "${title}": ${error.message}`);
    } finally {
      barEpub.increment(1, { filename: title });
    }

    if (SETTINGS.convertToPdf) {
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error('pdf creation was taking too long'));
        }, 120000);
      });
      try {
        await Promise.race([makePdf(bookData[title]), timeoutPromise]);
      } catch (error) {
        console.error(`PDF failed for "${title}": ${error.message}`);
      } finally {
        clearTimeout(timeoutHandle);
        barPdf.increment(1, { filename: title });
      }
    }
  });

  await Promise.allSettled(work);

  barEpub.update(length, { filename: 'epub files done' });
  if (SETTINGS.convertToPdf) {
    barPdf.update(length, { filename: 'pdf files done' });
  }
  multiBar.stop();
}


const markdownFiles = readInputFiles(SETTINGS.recursive);
const bookData = generateBookData(markdownFiles);
saveOutputFiles(bookData);
