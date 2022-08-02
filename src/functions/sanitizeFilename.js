function sanitizeFilename(string) {
  return string.replaceAll(/[^a-zA-Z0-9 -_ęóąśłżźćńĘÓĄŚŁŻŹĆŃ]/g, '');
}

module.exports = sanitizeFilename;