import React from 'react';
import ReactDOM from 'react-dom/client';
import Index from './Index.tsx'; // o App se l'hai rinominato

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Index />
  </React.StrictMode>
);
