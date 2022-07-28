import React from 'react';
import Section from './Section';

function Prose({ data }) {
  return <div className="Prose">
    {data.isStoryGroup ? <h1>{data.title}</h1> : ''}
    {data.sections.map((section) => <Section section={section} key={section.title} />)}
  </div>;
}

export default Prose;