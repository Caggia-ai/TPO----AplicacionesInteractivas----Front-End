/* Deja la demo lista para compartir: dist-demo/index.html -> dist-demo/gogogo-market-demo.html */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist-demo');
const from = path.join(dir, 'index.html');
const to = path.join(dir, 'gogogo-market-demo.html');
fs.renameSync(from, to);
console.log('Listo:', path.relative(process.cwd(), to), '(' + Math.round(fs.statSync(to).size / 1024) + ' KB)');
