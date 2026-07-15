
import './index.css'; // This imports your Tailwind styles
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// --- ENTRY POINT RENDERING ---
// Mounts the core React application into the root DOM element with StrictMode enabled.
