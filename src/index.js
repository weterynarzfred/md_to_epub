import React from 'react';
import ReactDOM from 'react-dom/client';

import { TEXT_CONTEXT } from './constants';
import App from './components/App';
import './epub_parts/style.css';
import './scss/main.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App textContext={TEXT_CONTEXT} />);