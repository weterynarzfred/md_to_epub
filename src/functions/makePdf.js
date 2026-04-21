const { exec } = require('child_process');
const fs = require('fs');
const path = require("path");

const { SETTINGS } = require('../constants');
const sanitizeFilename = require('./sanitizeFilename');

function runXeLatex(texPath) {
  return new Promise((resolve, reject) => {
    exec(`xelatex -interaction=nonstopmode -halt-on-error -output-directory="${path.dirname(texPath).replaceAll("\\", "/")}" "${texPath.replaceAll("\\", "/")}"`, (error, _stdout, stderr) => {
      if (error) {
        const err = new Error(`xelatex failed for ${texPath}`);
        err.cause = error;
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function makePdf(data) {
  const { getTexStructure } = require('./contentWrappers');

  return new Promise(async (resolve, reject) => {
    data.author = data.author.length === 0 ? [SETTINGS.author] : data.author;
    data.publisher = data.publisher.length === 0 ? [SETTINGS.publisher] : data.publisher;
    data.language = data.language ?? SETTINGS.language;
    data.fileName = (data.isStoryGroup ? '_' : '') + sanitizeFilename(data.title);

    const texPath = path.join("output", `${data.fileName}.tex`);

    try {
      const dir = path.dirname(texPath);
      console.log(dir);

      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(texPath, getTexStructure(data));
      await runXeLatex(texPath);
      await runXeLatex(texPath);
      try { fs.unlinkSync('output\\' + data.fileName + '.log'); } catch (e) { }
      try { fs.unlinkSync('output\\' + data.fileName + '.aux'); } catch (e) { }
      try { fs.unlinkSync('output\\' + data.fileName + '.toc'); } catch (e) { }
      try { fs.unlinkSync('output\\' + data.fileName + '.out'); } catch (e) { }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = makePdf;
