// Genera las tarjetas premium (informe y cotización) con datos de ejemplo. Uso: node tools/cards.mjs <carpeta>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const OUT = process.argv[2] || './cards'; fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9335, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'crd-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: 'http://localhost:5173/?c=' + Date.now() }); await sleep(3500);
const out = await ev(`(async()=>{const N=window.NURSE;N.S=N.DEFAULTS();N.demo();N.S.demo=false;document.querySelectorAll('.splash').forEach(e=>e.remove());
 const a=N.S.appts.find(x=>x.status==='hecha'&&x.report)||N.S.appts.find(x=>x.status==='hecha');
 a.record=a.record||{};a.record.vit={pa:'124/78',fc:'72',temp:'36.6',sat:'97'};a.record.vig=['Sin sangrado','Sin dolor'];
 a.report=a.report||{};a.report.family='Hoy visité a Rosa para su inyección de anticoagulante. Se aplicó en abdomen izquierdo, sin inconvenientes. Estuvo sin sangrado y sin dolor. Los signos vitales fueron controlados y quedaron registrados. Nos vemos mañana a las 08:30.';a.report.obs='Avísame si aparece sangrado, dolor intenso o algo que te preocupe. Mantén la zona limpia y seca.';
 const q=N.S.quotes[0];
 const [r,c]=[await N.reportCard(a),await N.quoteCard(q)];
 const b64=b=>new Promise(res=>{const f=new FileReader();f.onload=()=>res(f.result.split(',')[1]);f.readAsDataURL(b)});
 return JSON.stringify({r:await b64(r),c:await b64(c)})})()`);
const o = JSON.parse(out);
fs.writeFileSync(path.join(OUT, 'tarjeta_informe.png'), Buffer.from(o.r, 'base64'));
fs.writeFileSync(path.join(OUT, 'tarjeta_cotizacion.png'), Buffer.from(o.c, 'base64'));
console.log('ok'); ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
