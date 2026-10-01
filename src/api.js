/* Todas las llamadas al servidor pasan por acá.
   En la versión demo (npm run build:demo) no hay servidor: responde una simulación local. */
import { demoApi } from './demo/demoServer.js';

/* __DEMO__ lo define Vite al compilar: true solo en "npm run build:demo" */
export function api(path, opts = {}) {
  if (__DEMO__) return demoApi(path, opts);
  // abierta como archivo (file://) no hay servidor al que llamar
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return Promise.reject(new Error('file'));
  }
  const init = { ...opts, headers: { 'Content-Type': 'application/json' } };
  if (init.body && typeof init.body !== 'string') init.body = JSON.stringify(init.body);
  return fetch(path, init).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(j.error || 'El servidor respondió con un error (' + r.status + ').');
      e.status = r.status;
      throw e;
    }
    return j;
  });
}
