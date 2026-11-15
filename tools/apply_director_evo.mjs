// Inyecta la capa evolutiva (tools/director_evo.html) en un director.html. Idempotente.
// Uso: node tools/apply_director_evo.mjs <entrada.html> [salida.html]
import fs from 'node:fs';
const [inp, out] = process.argv.slice(2);
if (!inp) { console.error('falta archivo'); process.exit(1); }
let h = fs.readFileSync(inp, 'utf8');
const layer = fs.readFileSync(new URL('./director_evo.html', import.meta.url), 'utf8');
const i = h.indexOf('<!--evo-->');
if (i >= 0) { h = h.slice(0, i).trimEnd() + '\n</body></html>'; }
const k = h.lastIndexOf('</body>');
if (k < 0) { console.error('sin </body>'); process.exit(1); }
h = h.slice(0, k) + layer + '\n' + h.slice(k);
fs.writeFileSync(out || inp, h);
console.log('ok', (out || inp), h.length);
