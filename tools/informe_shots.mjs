// Capturas del informe nivel 2. Uso: node tools/informe_shots.mjs <carpeta>   (requiere serve.js en :5173)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const OUT = path.resolve(process.argv[2] || './ishots'); fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9341, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'ish-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
const shot = async (name, full) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('ok', name); };
const blobTo = async (expr, name) => { const b64 = await ev(`(async()=>{const b=await (${expr});return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(b)})})()`); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(b64, 'base64')); console.log('ok', name); };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: 'http://localhost:5173/?d=' + Date.now() });
await sleep(1500);
await ev(`(()=>{try{document.querySelector('.splash')?.remove()}catch(e){};return 1})()`);
await sleep(300);
// datos: una paciente con 4 visitas con evolución
const info = await ev(`(async()=>{const N=window.NURSE;N.S=N.DEFAULTS();N.demo();const S=N.S;S.demo=false;S.ui.imode='fam';
const p=S.patients[0];p.consent=p.consent||{date:N.today()};S.appts=S.appts.filter(a=>a.patientId!==p.id||a.status!=='hecha');
const mk=(ago,vit,vig,fam)=>{const d=N.addDays(N.today(),-ago);const a={id:'sh'+ago,patientId:p.id,type:'Inyectable anticoagulante',date:d,start:'08:30',dur:30,travel:15,price:15000,status:'hecha',zone:p.zone,record:{start:d+'T08:30',end:d+'T09:05',vit,vig,sitio:'Abdomen der.'},report:{family:fam||'Hoy visité a '+p.name.split(' ')[0]+' para su inyección. Se aplicó sin inconvenientes y quedó tranquila.',obs:'Si ves sangrado que no cede, mareo intenso o dolor en la zona, escríbeme. En una emergencia llama al 131.',clinical:'Inyectable subcutáneo abdominal.',approved:true,sent:ago>0}};S.appts.push(a);return a};
mk(6,{pa:'138/86',fc:'82',temp:'36.9',sat:'95'},['Sin dolor','Sin sangrado']);mk(4,{pa:'134/84',fc:'80',temp:'36.8',sat:'96'},['Sin dolor','Sin sangrado']);mk(2,{pa:'128/80',fc:'76',temp:'36.7',sat:'97'},['Sin dolor','Sin sangrado','Buen ánimo']);const a=mk(0,{pa:'124/78',fc:'74',temp:'36.6',sat:'98'},['Sin dolor','Sin sangrado','Buen ánimo']);
N.saveNow&&N.saveNow();return JSON.stringify({pid:p.id,aid:a.id,name:p.name})})()`);
const { pid, aid } = JSON.parse(info); console.log(info);
await ev(`location.hash='#/informe/${aid}';1`); await sleep(1800); await shot('i1_informe_familiar_top');
await ev(`window.scrollTo(0,900);1`); await sleep(400); await shot('i2_informe_evolucion');
await blobTo(`window.NURSE.reportCard(window.NURSE.A('${aid}'))`, 'tarjeta_informe_con_comparacion');
await ev(`location.hash='#/resumen/${pid}';1`); await sleep(1800); await shot('i3_resumen_top');
await ev(`window.scrollTo(0,950);1`); await sleep(400); await shot('i4_resumen_evolucion');
await blobTo(`window.NURSE.summaryCard(window.NURSE.P('${pid}'),7)`, 'tarjeta_resumen_semana');
await ev(`window.NURSE.S.ui.imode='cli';location.hash='#/informe/${aid}';1`); await sleep(300); await ev(`window.NURSE.route();1`); await sleep(1200); await ev(`window.scrollTo(0,1500);1`); await sleep(400); await shot('i5_informe_clinico');
ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
