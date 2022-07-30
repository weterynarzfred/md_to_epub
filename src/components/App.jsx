import React from 'react';

import Prose from './Prose';
import { TEXT_CONTEXT } from '../constants';
const generateBookData = require('../functions/generateBookData');

function getMarkdown() {
  const keys = TEXT_CONTEXT.keys();
  const values = keys.map(key => ({ fileName: key.replace(/^\.\//, ''), markdown: TEXT_CONTEXT(key).default }));
  return values;
}

function App() {
  const bookData = generateBookData(getMarkdown());

  return <div id="App">
    {Object
      .values(bookData)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((data) => <Prose key={data.title} data={data} />)}
  </div>;
}

export default App;