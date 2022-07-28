const SOURCE_PATH = "P:/pisanie/pisanie/";
const INFO = {
  author: 'test author',
  publisher: 'test publisher',
};

module.exports = { SOURCE_PATH, INFO };

try {
  module.exports.TEXT_CONTEXT = require.context("P:/pisanie/pisanie/", true, /\.md$/);
} catch (error) { }
