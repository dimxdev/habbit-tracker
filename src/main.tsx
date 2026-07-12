import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { applyTheme, getInitialTheme } from './hooks/useTheme';

// Terapkan tema sebelum render supaya tidak ada kedip (flash) warna terang.
applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Sembunyikan splash setelah frame pertama ter-render (fade lalu hapus).
const splash = document.getElementById('splash');
if (splash) {
  requestAnimationFrame(() => {
    window.setTimeout(() => {
      splash.classList.add('hide');
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }, 300);
  });
}
