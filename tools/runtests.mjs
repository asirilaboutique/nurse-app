// Corre toda la batería en Chrome headless (390x844). Uso: node tools/runtests.mjs   (requiere serve.js en :5173)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9336, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Page.navigate', { url: 'http://localhost:5173/?rt=' + Date.now() }); await sleep(4200);
await ev(`new Promise(r=>{const s=document.createElement('script');s.src='/tests.js?'+Date.now();s.onload=r;document.head.appendChild(s)})`);
let P = 0, T = 0; const fails = [];
for (let i = 1; i <= 40; i++) {
  const has = await ev(`!!(window.R&&R[${i}])||typeof runRound==='function'`);
  const r = JSON.parse(await ev(`runRound(${i}).then(x=>JSON.stringify(x)).catch(e=>JSON.stringify({round:${i},pass:0,total:0,fails:[],none:true}))`));
  if (r.none || r.total === 0) break;
  P += r.pass; T += r.total; r.fails.forEach(f => fails.push('R' + i + ' · ' + f.name + ' → ' + f.err));
  console.log('ronda', i, r.pass + '/' + r.total);
}
console.log('TOTAL', P + '/' + T); fails.forEach(f => console.log('FALLA', f));
console.log('errores de página:', JSON.stringify(await ev('window.__errs')));
ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
