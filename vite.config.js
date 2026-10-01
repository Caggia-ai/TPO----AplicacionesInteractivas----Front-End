import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/* "npm run build"       -> dist/            tienda real (habla con server/server.js)
   "npm run build:demo"  -> dist-demo/       un solo archivo HTML con los pagos simulados */
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';
  return {
    plugins: [react(), ...(demo ? [viteSingleFile()] : [])],
    define: { __DEMO__: JSON.stringify(demo) },
    build: { outDir: demo ? 'dist-demo' : 'dist', emptyOutDir: true },
    server: {
      port: 5173,
      // en desarrollo, las llamadas a /api van al servidor de Express
      proxy: { '/api': 'http://localhost:3000' },
    },
  };
});
