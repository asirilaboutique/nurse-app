// Fotogramas de la bienvenida (electro + logo) para revisar la animación. Uso: node tools/splash_frames.mjs <carpeta>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const OUT = process.argv[2] || './frames'; fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9334, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'spl-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: 'http://localhost:5173/?f=' + Date.now() });
const t0 = Date.now();
for (const ms of [500, 900, 1250, 1700, 2200, 2800]) {
  const w = ms - (Date.now() - t0); if (w > 0) await sleep(w);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, 'f_' + ms + '.png'), Buffer.from(r.result.data, 'base64')); console.log('ok', ms);
}
ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
