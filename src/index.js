import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './components/App';
import './epub_parts/style.css';
import './scss/main.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);