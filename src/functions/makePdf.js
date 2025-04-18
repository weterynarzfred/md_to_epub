const { exec } = require('child_process');
const fs = require('fs');

const { SETTINGS } = require('../constants');
const sanitizeFilename = require('./sanitizeFilename');

function makePdf(data) {
  const { getTexStructure } = require('./contentWrappers');

  return new Promise(resolve => {
    data.author = data.author.length === 0 ? [SETTINGS.author] : data.author;
    data.publisher = data.publisher.length === 0 ? [SETTINGS.publisher] : data.publisher;
    data.language = data.language ?? SETTINGS.language;
    data.fileName = (data.isStoryGroup ? '_' : '') + sanitizeFilename(data.title);

    fs.writeFileSync('output/' + data.fileName + '.tex', getTexStructure(data));
    exec(`xelatex --output-directory=output "output/${data.fileName}.tex"`, async (error, _stdout, _stderr) => {
      if (error) console.error(data.title + '.pdf failed');
      await new Promise(resolve => exec(`xelatex --output-directory=output "output/${data.fileName}.tex"`, resolve));
      try { fs.unlinkSync('output/' + data.fileName + '.log'); } catch (e) { }
      try { fs.unlinkSync('output/' + data.fileName + '.aux'); } catch (e) { }
      try { fs.unlinkSync('output/' + data.fileName + '.toc'); } catch (e) { }
      try { fs.unlinkSync('output/' + data.fileName + '.out'); } catch (e) { }
      resolve();
    });
  });
}

module.exports = makePdf;
