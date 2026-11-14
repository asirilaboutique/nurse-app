// Simula el uso de la app en un teléfono virtual y graba videos (screencast CDP + ffmpeg) y capturas.
// Uso: node tools/record.mjs <carpeta de salida>      (requiere serve.js en :5173, Chrome y ffmpeg)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const OUT = path.resolve(process.argv[2] || './videos'); fs.mkdirSync(OUT, { recursive: true });
const STILLS = path.join(OUT, 'capturas'); fs.mkdirSync(STILLS, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const BASE = 'http://localhost:5173/';
const PORT = 9337, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); let onFrame = null;
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Page.screencastFrame' && onFrame) onFrame(d.params); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const J = JSON.stringify;

/* ---------- helpers dentro de la página ---------- */
const INJECT = `(()=>{if(window.__rec)return;window.__rec=1;
 const st=document.createElement('style');st.textContent='.tapfx{position:fixed;z-index:9999;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:rgba(242,164,140,.45);border:3px solid rgba(201,120,93,.9);pointer-events:none;animation:tapfx .55s ease-out forwards}@keyframes tapfx{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.5);opacity:0}}';document.head.appendChild(st);
 window.__find=(s)=>{if(s.startsWith('text:')){const t=s.slice(5).toLowerCase();const c=[...document.querySelectorAll('a,button,label,[data-act]')].filter(e=>e.offsetParent!==null&&e.innerText&&e.innerText.toLowerCase().includes(t));return c[0]||null}return document.querySelector(s)};
 window.__tapfx=(s)=>{const e=window.__find(s);if(!e)return 'no:'+s;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const d=document.createElement('div');d.className='tapfx';d.style.left=(r.left+r.width/2)+'px';d.style.top=(r.top+r.height/2)+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),700);return 'ok'};
 window.__click=(s)=>{const e=window.__find(s);if(!e)return 'no:'+s;e.click();return 'ok'};
 window.__set=(s,v)=>{const e=window.__find(s);if(!e)return 'no:'+s;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return 'ok'};
 window.__type1=(s,ch)=>{const e=window.__find(s);if(!e)return 'no:'+s;e.focus();e.value+=ch;e.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'};
 window.__scroll=(y)=>{window.scrollTo({top:y,behavior:'smooth'});return 1};
})()`;
const tap = async (s, wait = 650) => { const r = await ev(`window.__tapfx(${J(s)})`); if (r !== 'ok') throw new Error('tap ' + r); await sleep(340); await ev(`window.__click(${J(s)})`); await sleep(wait); };
const setv = async (s, v, wait = 380) => { await ev(`window.__tapfx(${J(s)})`); await sleep(250); const r = await ev(`window.__set(${J(s)},${J(v)})`); if (r !== 'ok') throw new Error('set ' + r); await sleep(wait); };
const typ = async (s, text, gap = 70) => { await ev(`window.__tapfx(${J(s)})`); await sleep(280); for (const ch of text) { await ev(`window.__type1(${J(s)},${J(ch)})`); await sleep(gap); } await sleep(300); };
const scroll = async (y, wait = 900) => { await ev(`window.__scroll(${y})`); await sleep(wait); };
const go = async (hash, wait = 900) => { await ev(`location.hash=${J(hash)};1`); await sleep(wait); await ev(`window.scrollTo(0,0);1`); };
const still = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(STILLS, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('  captura', name); };

/* ---------- datos de ejemplo ---------- */
const PREP = `(async()=>{const N=window.NURSE;N.S=N.DEFAULTS();N.demo();N.S.demo=false;N.S.lastBackup=Date.now();
 N.S.profile.bank='Banco Estado · Cuenta RUT · a nombre de Valeria';N.S.profile.wa=N.S.profile.wa||'+56911112222';
 const mk=(c1,c2,t)=>new Promise(r=>{const c=document.createElement('canvas');c.width=900;c.height=700;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,900,700);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,900,700);x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(450,330,170,0,7);x.fill();x.fillStyle='rgba(255,255,255,.6)';x.font='42px sans-serif';x.textAlign='center';x.fillText(t,450,600);c.toBlob(b=>r(new File([b],'e.png',{type:'image/png'})),'image/png')});
 const a=N.S.appts.find(x=>x.status==='hecha'&&x.report)||N.S.appts.find(x=>x.status==='hecha');
 a.record=a.record||{};a.record.vit={pa:'124/78',fc:'72',temp:'36.6',sat:'97'};a.record.vig=['Sin sangrado','Sin dolor'];
 a.report=a.report||{};a.report.family='Hoy visité a '+N.P(a.patientId).name.split(/[ ,]/)[0]+' para su inyección de anticoagulante. Se aplicó en abdomen izquierdo, sin inconvenientes. Estuvo sin sangrado y sin dolor. Los signos vitales fueron controlados y quedaron registrados.';a.report.obs='Avísame si aparece sangrado, dolor intenso o algo que te preocupe.';a.report.approved=true;
 a.media=[];await N.addMedia(a,[await mk('#E3EEF9','#2E9C8F','Foto de ejemplo'),await mk('#F4EBDD','#C9785D','Foto de ejemplo')]);a.media[0].cap='Zona limpia, sin hematoma';a.media[0].fam=true;a.media[1].cap='Curación terminada';a.media[1].fam=true;
 N.P(a.patientId).drive='https://drive.google.com/drive/folders/ejemplo';
 N.S.lastBackup=0;
 N.saveNow();return a.id+'|'+a.patientId})()`;

/* ---------- grabación ---------- */
async function record(name, fn) {
  console.log('▶', name);
  const dir = path.join(os.tmpdir(), 'frames_' + name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const frames = [];
  onFrame = p => { const f = path.join(dir, String(frames.length).padStart(5, '0') + '.jpg'); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); frames.push({ f, t: p.metadata.timestamp }); send('Page.screencastFrameAck', { sessionId: p.sessionId }); };
  await send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  await sleep(300); await fn(); await sleep(900);
  await send('Page.stopScreencast'); onFrame = null;
  if (frames.length < 2) throw new Error('sin cuadros en ' + name);
  const list = frames.map((fr, i) => `file '${fr.f.replace(/\\/g, '/')}'\nduration ${Math.max(0.02, (i < frames.length - 1 ? frames[i + 1].t - fr.t : 1.2)).toFixed(3)}`).join('\n') + `\nfile '${frames[frames.length - 1].f.replace(/\\/g, '/')}'\n`;
  const lf = path.join(dir, 'list.txt'); fs.writeFileSync(lf, list);
  const o = path.join(OUT, name + '.mp4');
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lf, '-f', 'lavfi', '-i', 'color=c=0x14275F:s=1080x1920:r=30',
    '-filter_complex', '[0:v]fps=30,scale=-2:1800:flags=lanczos,format=yuv420p[s];[1:v][s]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[v]', '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-movflags', '+faststart', o], { stdio: 'inherit' });
  console.log('  video', o, frames.length + ' cuadros');
}

await send('Page.navigate', { url: BASE + '?rec=' + Date.now() }); await sleep(3800);
await ev(INJECT);
const ids = (await ev(PREP)).split('|'); const apptId = ids[0], patId = ids[1];

/* V1 · Entrada + el día de Valeria */
await ev(`sessionStorage.removeItem('splash');1`);
await record('01_entrada_y_dia', async () => {
  await ev(`location.href=${J(BASE + '?v1=' + Date.now() + '#/hoy')};1`); await sleep(4600);
  await ev(INJECT);
  await still('hoy_primeros_pasos'); await scroll(520, 1100); await still('hoy_agenda_del_dia');
  await scroll(1100, 1200); await scroll(1700, 1200); await still('hoy_por_enviar');
  await scroll(0, 1000);
  await tap('[data-act=menu]', 1200); await still('menu_mas'); await ev(`window.NURSE&&document.querySelector('[data-act=closesheet]')&&document.querySelector('[data-act=closesheet]').click();1`); await sleep(700);
});

/* V2 · Visita → informe → tarjeta */
await go('#/hoy', 600);
await record('02_visita_informe_tarjeta', async () => {
  await ev(INJECT);
  await go('#/hoy', 900);
  await ev(`(()=>{const N=window.NURSE;const a=N.S.appts.find(x=>x.status==='prog'&&x.date===N.today())||N.S.appts.find(x=>x.status==='prog');if(a){a.date=N.today();N.S.appts.filter(x=>x.status==='curso').forEach(x=>x.status='prog');N.saveNow();N.route()}return a?a.id:''})()`); await sleep(700);
  await tap('[data-act=start]', 1500);
  await typ('[name=pa]', '124/78'); await typ('[name=fc]', '72'); await typ('[name=temp]', '36.6'); await typ('[name=sat]', '97');
  await scroll(400, 700);
  await tap('text:sin sangrado', 500); await tap('text:sin dolor', 500);
  await typ('#nota', 'Se mostró tranquila y colaboradora.', 45);
  await still('visita_en_curso_completa');
  await scroll(900, 700);
  await tap('button[type=submit]', 2600);
  await still('informe_con_tarjeta');
  await scroll(520, 1200); await still('informe_tarjeta_grande'); await scroll(1250, 1400); await scroll(1900, 1100);
});

/* V3 · Cotización */
await record('03_cotizacion', async () => {
  await ev(INJECT);
  await go('#/cotizar', 900);
  await setv('[name=patientId]', patId, 600);
  await tap('text:visita de procedimiento', 500);
  await setv('[name=servicio]', 'Tratamiento inyectable domiciliario · 7 días', 500);
  await setv('[name=qty]', '7', 500);
  await scroll(500, 900); await still('cotizar_formulario');
  await tap('button[type=submit]', 2400);
  await still('cotizacion_portada'); await scroll(560, 1300); await still('cotizacion_tarjeta'); await scroll(1250, 1300); await scroll(2000, 1100);
});

/* V4 · Portal de la familia */
const code = await ev(`(async()=>{const N=window.NURSE;const p=N.P(${J(patId)});N.S.ui.portal=N.S.ui.portal||{};N.S.ui.portal[p.id]={pin:'482113',days:30,exp:N.addDays(N.today(),30),inf:true,cot:true,pay:true,evi:true,rev:false};N.saveNow();const url=await N.portalUrl(p);return url.split('#/p/')[1]})()`);
await record('04_portal_familia', async () => {
  await ev(INJECT);
  await ev(`Object.keys(window.NURSE.PCACHE).forEach(k=>delete window.NURSE.PCACHE[k]);location.hash='#/p/${code}';1`); await sleep(1500);
  await still('portal_pin');
  await tap('#pinin', 300); for (const ch of '482113') { await ev(`window.__type1('#pinin',${J(ch)})`); await sleep(260); }
  await tap('#pinbtn', 1700); await still('portal_inicio'); await scroll(500, 1000);
  for (const [t, n] of [['Historia', 'portal_historia'], ['Fotos', 'portal_fotos'], ['Informes', 'portal_informe'], ['Pagos', 'portal_pagos']]) { await tap('nav.tabs a[href$="/' + { Historia: 'historia', Fotos: 'fotos', Informes: 'informe', Pagos: 'pagos' }[t] + '"]', 1300); await still(n); }
});

/* tarjetas crudas */
const cards = JSON.parse(await ev(`(async()=>{const N=window.NURSE;const a=N.A(${J(apptId)});const q=N.S.quotes[0];const b64=b=>new Promise(res=>{const f=new FileReader();f.onload=()=>res(f.result.split(',')[1]);f.readAsDataURL(b)});return JSON.stringify({r:await b64(await N.reportCard(a)),c:await b64(await N.quoteCard(q))})})()`));
fs.writeFileSync(path.join(OUT, 'tarjeta_informe_1080x1350.png'), Buffer.from(cards.r, 'base64'));
fs.writeFileSync(path.join(OUT, 'tarjeta_cotizacion_1080x1350.png'), Buffer.from(cards.c, 'base64'));
console.log('listo'); ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
