import React from 'react';
import ReactDOM from 'react-dom/client';
import { OptionsPage } from '../pages/OptionsPage';
import '../popup/popup.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);
