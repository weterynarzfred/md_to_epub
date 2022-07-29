import React from 'react';

import Prose from './Prose';
const generateBookData = require('../functions/generateBookData');

function getMarkdown(textContext) {
  const keys = textContext.keys();
  const values = keys.map(key => ({ fileName: key.replace(/^\.\//, ''), markdown: textContext(key).default }));
  return values;
}

function App({ textContext }) {
  const bookData = generateBookData(getMarkdown(textContext));

  return <div id="App">
    {Object
      .values(bookData)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((data) => <Prose key={data.title} data={data} />)}
  </div>;
}

export default App;