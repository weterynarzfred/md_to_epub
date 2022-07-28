const processMarkdown = require('./processMarkdown');

function generateBookData(markdownFiles) {
  const bookData = {};

  for (const file of markdownFiles) {
    const data = processMarkdown(file.markdown, file.fileName);
    if (data) {
      const isStoryGroup = ![undefined, ''].includes(data.params.story);
      const title = isStoryGroup ? data.params.story.replaceAll(/[\[\]]/g, '') : data.title;
      if (bookData[title] === undefined) bookData[title] = {
        title,
        isStoryGroup,
        language: data.params.language,
        sections: [],
      };
      bookData[title].sections.push(data);
    }
  }

  for (const title in bookData) {
    bookData[title].sections = bookData[title].sections.sort((a, b) =>
      (a.params.order ?? a.title).localeCompare(b.params.order ?? b.title));
  }

  return bookData;
}

module.exports = generateBookData;