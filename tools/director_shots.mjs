// Capturas del Director evolucionado. Uso: node tools/director_shots.mjs <carpeta>   (requiere serve.js en :5173)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const OUT = path.resolve(process.argv[2] || './dshots'); fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9338, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result?.result?.value; };
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('ok', name); };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: 'http://localhost:5173/director/?d=' + Date.now() });
await sleep(900); await shot('d1_entrada_electro'); await sleep(1500); await shot('d2_entrada_logo'); await sleep(2600);
const errs = await ev(`(()=>{window.__e=[];window.addEventListener('error',e=>window.__e.push(e.message));return typeof dash==='undefined'?'ok':'ok'})()`);
// simular progreso: marca como buenas ~60% de las tomas del rodaje 3
const info = await ev(`(()=>{const q=queue();let n=0;q.forEach((it,i)=>{if(i%5!==4&&i<q.length*0.8){TK[cr][it.id+'_T1']={id:it.id,set:it.set,toma:1,buena:true,at:Date.now()+i};n++}});draw();render();return JSON.stringify({cr,total:q.length,buenas:n,dash:!!document.getElementById('evoDash'),h:document.getElementById('evoDash').innerText.slice(0,120)})})()`);
console.log(info); await sleep(1200); await shot('d3_panel_rodaje');
await ev(`window.scrollTo(0,520);1`); await sleep(500); await shot('d4_panel_sets_y_lista');
await ev(`window.scrollTo(0,0);document.querySelector('.modes button[data-m=est]').click();1`); await sleep(900); await shot('d5_sala_estudio');
await ev(`mode('ap');window.scrollTo(0,0);1`); await sleep(500);
const b64 = await ev(`(async()=>{const el=document.getElementById('evoCard');const orig=navigator.canShare;navigator.canShare=()=>false;const blob=await new Promise(res=>{const a0=URL.createObjectURL;URL.createObjectURL=b=>{res(b);return a0.call(URL,b)};el.click()});return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(blob)})})()`);
fs.writeFileSync(path.join(OUT, 'informe_de_rodaje_1080x1350.png'), Buffer.from(b64, 'base64')); console.log('ok informe');
console.log('errores:', JSON.stringify(await ev('window.__e')));
ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
