import React from 'react';
import { SETTINGS } from '../constants';

function Section({ section }) {
  const lang = [undefined, '', null]
    .includes(section?.params?.language) ?
    SETTINGS.language :
    section?.params?.language;

  return <div
    className="section"
    lang={lang}
    dangerouslySetInnerHTML={{ __html: section.html }}
  >
  </div>;
}

export default Section;