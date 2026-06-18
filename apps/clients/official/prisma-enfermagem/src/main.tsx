import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const theme = new URLSearchParams(window.location.search).get('theme');

if (theme === 'light' || theme === 'dark') {
  document.documentElement.dataset.theme = theme;
} else {
  document.documentElement.removeAttribute('data-theme');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
