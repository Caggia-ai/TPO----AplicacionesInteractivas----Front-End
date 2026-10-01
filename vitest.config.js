import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/* En las pruebas no se compila con Vite, así que __DEMO__ es una variable global que cada prueba
   puede poner en true o false. Así una misma tanda prueba la tienda real y la demo. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.jsx', 'test/**/*.test.js'],
    exclude: ['test/server.test.js', 'node_modules/**'],
    testTimeout: 15000,
  },
});
