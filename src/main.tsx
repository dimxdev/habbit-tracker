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

// Sembunyikan splash setelah frame pertama ter-render (fade lalu hapus),
// lalu lepas kunci scroll (splash-lock) supaya app bisa di-scroll normal.
const splash = document.getElementById('splash');
const unlockScroll = () => document.documentElement.classList.remove('splash-lock');
if (splash) {
  requestAnimationFrame(() => {
    window.setTimeout(() => {
      splash.classList.add('hide');
      splash.addEventListener(
        'transitionend',
        () => { splash.remove(); unlockScroll(); },
        { once: true }
      );
      // Jaring pengaman bila transitionend tak ter-trigger
      window.setTimeout(() => { splash.remove(); unlockScroll(); }, 700);
    }, 300);
  });
} else {
  unlockScroll();
}
