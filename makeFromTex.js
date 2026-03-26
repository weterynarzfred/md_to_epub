const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function compileTex(texPath) {
  return new Promise((resolve, reject) => {
    const absoluteTexPath = path.resolve(texPath);

    if (!fs.existsSync(absoluteTexPath)) {
      reject(new Error(`TeX file not found: ${texPath}`));
      return;
    }

    if (path.extname(absoluteTexPath).toLowerCase() !== '.tex') {
      reject(new Error(`Expected a .tex file, got: ${texPath}`));
      return;
    }

    const outputDir = path.dirname(absoluteTexPath);
    const fileName = path.basename(absoluteTexPath, '.tex');

    exec(`xelatex --output-directory="${outputDir}" "${absoluteTexPath}"`, (error) => {
      if (error) {
        reject(new Error(`First xelatex pass failed for ${texPath}`));
        return;
      }

      exec(`xelatex --output-directory="${outputDir}" "${absoluteTexPath}"`, (secondError) => {
        if (secondError) {
          reject(new Error(`Second xelatex pass failed for ${texPath}`));
          return;
        }

        for (const extension of ['.log', '.aux', '.toc', '.out']) {
          try {
            fs.unlinkSync(path.join(outputDir, `${fileName}${extension}`));
          } catch (_) {
            // Ignore missing aux files.
          }
        }

        resolve(path.join(outputDir, `${fileName}.pdf`));
      });
    });
  });
}

async function main() {
  const texPath = process.argv[2];

  if (!texPath) {
    console.error('Usage: node ./makeFromTex.js <path/to/file.tex>');
    process.exitCode = 1;
    return;
  }

  try {
    const pdfPath = await compileTex(texPath);
    console.log(`Created: ${pdfPath}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
