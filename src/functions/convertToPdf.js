const { exec } = require("child_process");

function convertToPdf(data, extension) {
  return new Promise(resolve => {
    exec(`ebook-convert "output/${data.fileName}.${extension}" "output/${data.fileName}.pdf" --paper-size a5 --pdf-default-font-size 12 --pdf-footer-template "<footer style='margin: 0 auto;'>&mdash; _PAGENUM_ &mdash;</footer>" --pdf-odd-even-offset 0 --pdf-page-margin-bottom 46 --pdf-page-margin-left 46 --pdf-page-margin-right 46 --pdf-page-margin-top 46 --pdf-page-number-map "n + 2" --pdf-serif-family "CMU Serif" --pdf-standard-font serif`, (error, _stdout, _stderr) => {
      if (error) console.error(data.title + '.pdf failed');
      resolve();
    });
  });
}

module.exports = convertToPdf;