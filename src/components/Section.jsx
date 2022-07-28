import React from 'react';

function Section({ section }) {
  return <div
    className="Section"
    lang={
      [undefined, '', null]
        .includes(section?.props?.language) ?
        'pl' :
        section?.props?.language
    }
    dangerouslySetInnerHTML={{ __html: section.html }}
  >
  </div>;
}

export default Section;