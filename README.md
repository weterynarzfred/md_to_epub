# md to epub

This is a simple node.js script that converts markdown into epub files. It can also generate a html preview.

If you want to make something similar yourself:
- For generating html from markdown I'm using [markdown-it](https://github.com/markdown-it/markdown-it).
- For making epub files I'm using [jszip](https://github.com/Stuk/jszip) (an epub is just a zip with specific contents).
- For hyphenation I'm using [hyphen](https://github.com/ytiurin/hyphen).

## commands
By default the script loads files from the `./content` folder. You can change this in `./src/constants.js`. Take note that you need to change both `SOURCE_PATH` and `TEXT_CONTENT` - they parse relative paths differently.

- `start` - displays the combined preview at http://localhost:3000/
- `build` - creates a (very unoptimized) html file.
- `make_epub` - creates epub files in the `output` folder.

## settings
Settings are located in `./src/constants.js`.
- `author` - default author of the book, can be overridden by the `author` param if `SETTINGS.parseGtAsProps` is set to `true`.
- `publisher` - default publisher of the book, can be overridden same as author.
- `language` - default language code of the book, can be overridden same as author.
- `filter` - a function that will decide whether to parse a file or skip it
- `parseGtAsProps` - enables special parameters parsed from lines starting with `>`, check below.
- `addEmptyLines` - markdown removes single linebreaks by default, this simply doubles every linebreak to display them as paragraphs.
- `hyphenate` - adds soft hyphens.
- `replaceSeparators` - replaces markdown separators (`<hr>`) with stylized asterisks.
- `stripCodeBlocks` - an array of code languages that should be removed, set to `true` to remove all code blocks.
- `stripComments` - removes markdown comments denoted with double percent signs eg. `%%comment%%`.

## special parameters
If you set `SETTINGS.parseGtAsProps` as true all lines starting with `>` will be treated as parameters. If the param starts with `#` it is marked as a tag. Otherwise the script expects key value pairs separated by two colons.

Example:
```
> #prose 
> language:: en
> story:: [[Little Cats]]
> order:: cats chapter 1
> character:: [[Cat 2]], [[Cat 3]]
```
will be parsed as:
```json
{
  'tag': 'prose',
  'language': 'en',
  'story': '[[Little Cats]]'
  'order': 'cats chapter 1',
  'character': '[[Cat 2]], [[Cat 3]]'
}
```

- Files with same `story` param will be grouped together.
- Files are ordered by the `order` param if available or the name of the file.
- `language` param will override `SETTINGS.language` for the specific story. If multiple files belong to the same story, only the language of the first one will be set in the epub.