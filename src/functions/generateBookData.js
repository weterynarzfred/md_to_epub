const processMarkdown = require('./processMarkdown');

function generateBookData(markdownFiles) {
  const bookData = {};

  for (const file of markdownFiles) {
    const data = processMarkdown(file.markdown, file.fileName);
    if (data) {
      const isStoryGroup = ![undefined, ''].includes(data.params?.story);
      const title = isStoryGroup ? data.params.story.replaceAll(/[\[\]]/g, '') : data.title;
      if (bookData[title] === undefined) bookData[title] = {
        title,
        isStoryGroup,
        language: data.params?.language,
        author: [],
        publisher: [],
        sections: [],
      };
      if (
        ![undefined, ''].includes(data.params?.author) &&
        !bookData[title].author.includes(data.params.author)
      )
        bookData[title].author.push(data.params.author);
      if (
        ![undefined, ''].includes(data.params?.publisher) &&
        !bookData[title].publisher.includes(data.params.publisher)
      )
        bookData[title].publisher.push(data.params.publisher);
      if (![undefined, ''].includes(data.params?.cover))
        bookData[title].cover = data.params.cover;

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