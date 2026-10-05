import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './context/StoreContext.jsx';
import './index.css';

/* Todo lo que antes vivía en index.html se arma acá, antes de montar React,
   para que el documento quede casi vacío y la página siga sin parpadeos. */

document.documentElement.setAttribute('lang', 'es');
document.title = 'Gogogo Market — Figuras de anime';

const head = document.head;
const meta = (attrs) => head.appendChild(Object.assign(document.createElement('meta'), attrs));
meta({ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content' });

const link = (attrs) => head.appendChild(Object.assign(document.createElement('link'), attrs));
link({ rel: 'preconnect', href: 'https://fonts.googleapis.com' });
link({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' });
link({
  rel: 'stylesheet',
  href: 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Reggae+One&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap',
});

document.body.id = 'top';
document.body.className = 'bg-base-100 text-base-content font-body text-base leading-normal';

/* Tema inicial: el guardado, o el del sistema (evita el parpadeo claro/oscuro).
   Se hace acá arriba, antes de montar React, para que pinte con el tema correcto desde el primer cuadro. */
(function initTheme() {
  let t = null;
  try { t = JSON.parse(window.localStorage.getItem('gg_theme')); } catch (e) { /* sin almacenamiento */ }
  if (t !== 'manga' && t !== 'mangadark') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'mangadark' : 'manga';
  }
  document.documentElement.setAttribute('data-theme', t);

  let s = null;
  try { s = JSON.parse(window.localStorage.getItem('gg_saga')); } catch (e) { /* sin almacenamiento */ }
  if (s === 'ragnarok' || s === 'jojo' || s === 'mix') document.documentElement.setAttribute('data-saga', s);
  else document.documentElement.setAttribute('data-saga', 'mix');
})();

createRoot(document.getElementById('root')).render(
 <BrowserRouter>
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
 </BrowserRouter>,
);
