// Tomas NUEVAS de la versión actual para la agencia: capturas en alta + clips verticales, sin cursor, sin montos, datos ficticios.
// Uso: node tools/record_actual.mjs <carpeta de salida>   (requiere serve.js en :5173, Chrome y ffmpeg en PATH)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const OUT = path.resolve(process.argv[2] || './actual'); fs.mkdirSync(OUT, { recursive: true });
const CAP = path.join(OUT, 'capturas'); fs.mkdirSync(CAP, { recursive: true });
const CLIPS = path.join(OUT, 'clips'); fs.mkdirSync(CLIPS, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const BASE = 'http://localhost:5173/';
const PORT = 9343, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'rca-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); let onFrame = null;
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Page.screencastFrame' && onFrame) onFrame(d.params); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result?.result?.value; };
const J = JSON.stringify;
const dsf = async f => send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: f, mobile: true });
await send('Page.enable'); await send('Runtime.enable'); await dsf(3);

const INJECT = `(()=>{if(window.__rec)return;window.__rec=1;
 window.__find=(s)=>{if(s.startsWith('text:')){const t=s.slice(5).toLowerCase();const c=[...document.querySelectorAll('a,button,label,[data-act]')].filter(e=>e.offsetParent!==null&&e.innerText&&e.innerText.toLowerCase().includes(t));return c[0]||null}return document.querySelector(s)};
 window.__click=(s)=>{const e=window.__find(s);if(!e)return 'no:'+s;e.scrollIntoView({block:'center'});e.click();return 'ok'};
 window.__set=(s,v)=>{const e=window.__find(s);if(!e)return 'no:'+s;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return 'ok'};
 window.__type1=(s,ch)=>{const e=window.__find(s);if(!e)return 'no:'+s;e.value+=ch;e.dispatchEvent(new Event('input',{bubbles:true}));return 'ok'};
 window.__scroll=(y)=>{window.scrollTo({top:y,behavior:'smooth'});return 1};
})()`;
const tap = async (s, wait = 700) => { const r = await ev(`window.__click(${J(s)})`); if (r !== 'ok') throw new Error('tap ' + r); await sleep(wait); };
const setv = async (s, v, wait = 300) => { const r = await ev(`window.__set(${J(s)},${J(v)})`); if (r !== 'ok') throw new Error('set ' + r); await sleep(wait); };
const typ = async (s, text, gap = 55) => { for (const ch of text) { await ev(`window.__type1(${J(s)},${J(ch)})`); await sleep(gap); } await sleep(200); };
const scroll = async (y, wait = 800) => { await ev(`window.__scroll(${y})`); await sleep(wait); };
const go = async (hash, wait = 900) => { await ev(`location.hash=${J(hash)};1`); await sleep(wait); await ev(`window.scrollTo(0,0);1`); };
const problems = [];
const check = async name => { // ningún monto ni "en vivo" en pantalla
  const t = await ev(`document.body.innerText`);
  if (/\$\s?\d|\d\s?\$|CLP/.test(t)) problems.push(name + ': hay un monto en pantalla');
  if (/en vivo/i.test(t)) problems.push(name + ': dice "en vivo"');
};
const still = async name => { await ev(`(()=>{let s=document.getElementById('nots');if(!s){s=document.createElement('style');s.id='nots';s.textContent='.toast{display:none!important}';document.head.appendChild(s)}return 1})()`); await sleep(150); await check(name); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(CAP, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('  captura', name); };

/* datos ficticios, sin dinero */
const PREP = `(async()=>{const N=window.NURSE;N.S=N.DEFAULTS();N.demo();const S=N.S;S.demo=false;S.lastBackup=Date.now();S.charges=[];S.quotes=[];
 S.profile.wa=S.profile.wa||'+56911112222';
 const mkimg=(c1,c2,t)=>new Promise(r=>{const c=document.createElement('canvas');c.width=900;c.height=700;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,900,700);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,900,700);x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(450,330,170,0,7);x.fill();x.fillStyle='rgba(255,255,255,.6)';x.font='42px sans-serif';x.textAlign='center';x.fillText(t,450,600);c.toBlob(b=>r(new File([b],'e.png',{type:'image/png'})),'image/png')});
 const p=S.patients[0];p.consent=p.consent||{date:N.today()};p.drive='https://drive.google.com/drive/folders/ejemplo';
 S.appts=S.appts.filter(a=>a.patientId!==p.id||a.status!=='hecha');
 const first=p.name.split(/[ ,]/)[0];
 const mk=(ago,vit,vig,sent)=>{const d=N.addDays(N.today(),-ago);const a={id:'v'+ago+Math.random().toString(36).slice(2,5),patientId:p.id,type:'Inyectable anticoagulante',date:d,start:'08:30',dur:30,travel:15,price:0,status:'hecha',zone:p.zone,record:{start:d+'T08:30',end:d+'T09:05',vit,vig,sitio:'Abdomen izq.',farmaco:'Anticoagulante'},report:{family:'Hoy visité a '+first+' para su inyección de anticoagulante. Se aplicó en abdomen izquierdo, sin inconvenientes. Estuvo sin sangrado y sin dolor. Los signos vitales fueron controlados y quedaron registrados.',obs:'Avísame si aparece sangrado, dolor intenso o algo que te preocupe. En una emergencia llama al 131.',clinical:'Inyectable subcutáneo en abdomen izquierdo. Sin hallazgos.',approved:true,sent:sent}};S.appts.push(a);return a};
 mk(6,{pa:'138/86',fc:'82',temp:'36.9',sat:'95'},['Sin dolor','Sin sangrado'],true);mk(4,{pa:'134/84',fc:'80',temp:'36.8',sat:'96'},['Sin dolor','Sin sangrado'],true);mk(2,{pa:'128/80',fc:'76',temp:'36.7',sat:'97'},['Sin dolor','Sin sangrado','Buen ánimo'],true);
 const a=mk(1,{pa:'124/78',fc:'74',temp:'36.6',sat:'98'},['Sin dolor','Sin sangrado','Buen ánimo'],false);
 a.media=[];await N.addMedia(a,[await mkimg('#E3EEF9','#2E9C8F','Foto de ejemplo'),await mkimg('#F4EBDD','#C9785D','Foto de ejemplo')]);a.media[0].cap='Zona limpia, sin hematoma';a.media[0].fam=true;a.media[1].cap='Curación terminada';a.media[1].fam=true;
 /* visita de hoy para el clip de cierre */
 S.appts=S.appts.filter(x=>x.status==='hecha'&&x.patientId===p.id);
 const cur={id:'hoyvisita',patientId:p.id,type:'Inyectable anticoagulante',date:N.today(),start:'09:00',dur:30,travel:15,price:0,status:'prog',zone:p.zone,record:null,report:null};S.appts.push(cur);S.patients.slice(1,3).forEach((q,i)=>S.appts.push({id:'ot'+i,patientId:q.id,type:i?'Control de signos vitales':'Curación avanzada',date:N.today(),start:i?'11:30':'10:15',dur:i?30:45,travel:15,price:0,status:'prog',zone:q.zone,record:null,report:null}));S.appts.push({id:'ma',patientId:(S.patients[3]||S.patients[2]).id,type:'Curación avanzada',date:N.today(),start:'08:00',dur:30,travel:10,price:0,status:'hecha',zone:(S.patients[3]||S.patients[2]).zone,record:{start:N.today()+'T08:00',end:N.today()+'T08:35',vit:{pa:'118/74',fc:'70',temp:'36.5',sat:'98'},vig:['Sin dolor']},report:{family:'Curación realizada sin inconvenientes.',obs:'',clinical:'x',approved:true,sent:true}});
 S.appts.push({id:'prox',patientId:p.id,type:'Inyectable anticoagulante',date:N.addDays(N.today(),1),start:'08:30',dur:30,travel:15,price:0,status:'prog',zone:p.zone,record:null,report:null});
 N.saveNow();return a.id+'|'+p.id})()`;

async function record(name, fn, maxS = 10.5) {
  await ev(`(()=>{const s=document.getElementById('nots');if(s)s.remove();return 1})()`);
  console.log('▶', name);
  const dir = path.join(os.tmpdir(), 'frames_' + name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const frames = [];
  onFrame = p => { const f = path.join(dir, String(frames.length).padStart(5, '0') + '.jpg'); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); frames.push({ f, t: p.metadata.timestamp }); send('Page.screencastFrameAck', { sessionId: p.sessionId }); };
  await send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  await sleep(250); await fn(); await sleep(700);
  await send('Page.stopScreencast'); onFrame = null;
  if (frames.length < 2) throw new Error('sin cuadros en ' + name);
  const list = frames.map((fr, i) => `file '${fr.f.replace(/\\/g, '/')}'\nduration ${Math.max(0.02, (i < frames.length - 1 ? frames[i + 1].t - fr.t : 1.0)).toFixed(3)}`).join('\n') + `\nfile '${frames[frames.length - 1].f.replace(/\\/g, '/')}'\n`;
  const lf = path.join(dir, 'list.txt'); fs.writeFileSync(lf, list);
  const o = path.join(CLIPS, name + '.mp4');
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lf, '-t', String(maxS), '-f', 'lavfi', '-i', 'color=c=0x14275F:s=1080x1920:r=30',
    '-filter_complex', '[0:v]fps=30,scale=-2:1800:flags=lanczos,format=yuv420p[s];[1:v][s]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[v]', '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-movflags', '+faststart', o], { stdio: 'inherit' });
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', o]).toString().trim();
  console.log('  clip', name, (+dur).toFixed(1) + ' s');
}

/* ---------- 1) entrada ---------- */
await send('Page.navigate', { url: BASE + '?fresh=' + Date.now() }); await sleep(900);
await ev(`sessionStorage.clear();1`);
await send('Page.navigate', { url: BASE + '?e1=' + Date.now() + '#/hoy' }); await sleep(1400);
await still('00a_entrada_electro'); await sleep(1700); await still('00b_entrada_logo'); await sleep(2600);
await ev(INJECT);
const ids = (await ev(PREP)).split('|'); const apptId = ids[0], patId = ids[1];
await ev('window.NURSE.route();1'); await sleep(3600);

/* ---------- 2) capturas en alta (1170x2532) ---------- */
await ev(`location.hash='#/hoy';1`); await sleep(1200); await ev(`window.scrollTo(0,0);1`); await still('01_hoy_inicio');
await scroll(520, 900); await still('02_hoy_agenda_del_dia');
await go('#/agenda', 1000); await still('03_agenda');
await go('#/ficha/' + patId, 1000); await still('04_ficha_paciente');
await ev(`window.NURSE.S.ui.ftab='res';1`);
await go('#/hoy', 700);
await ev(`(()=>{const N=window.NURSE;N.S.appts.filter(x=>x.status==='curso').forEach(x=>x.status='prog');N.saveNow();N.route();return 1})()`); await sleep(500);
await tap('[data-act=start]', 1400);
await ev(`(()=>{const a=window.NURSE.A('hoyvisita');if(a&&a.record){a.record.start=new Date(Date.now()-35*60000).toISOString();window.NURSE.saveNow();window.NURSE.route()}return 1})()`); await sleep(500);
await ev(INJECT);
await typ('[name=pa]', '124/78', 20); await typ('[name=fc]', '72', 20); await typ('[name=temp]', '36.6', 20); await typ('[name=sat]', '97', 20);
await tap('text:sin sangrado', 300); await tap('text:sin dolor', 300); await typ('#nota', 'Se mostró tranquila y colaboradora.', 10);
await ev(`window.scrollTo(0,0);1`); await sleep(300); await still('05_visita_en_curso');
await scroll(600, 700); await still('06_visita_registro');
await ev(`window.scrollTo(0,99999);1`); await sleep(500); await still('07_visita_cerrar');
await tap('button[type=submit]', 2600);
await still('08_informe_con_tarjeta'); await scroll(520, 900); await still('09_informe_tarjeta_grande');
await scroll(1200, 900); await still('10_informe_evolucion_signos'); await scroll(1900, 900); await still('11_informe_texto_y_envio');
await ev(`window.NURSE.S.ui.imode='cli';window.NURSE.route();1`); await sleep(1200); await ev(`window.scrollTo(0,1300);1`); await sleep(500); await still('12_informe_clinico_tabla'); await ev(`window.NURSE.S.ui.imode='fam';1`);
await go('#/resumen/' + patId, 1900); await still('13_resumen_semana_nuevo'); await scroll(900, 900); await still('14_resumen_evolucion_y_mensaje');
/* portal */
const code = await ev(`(async()=>{const N=window.NURSE;const p=N.P(${J(patId)});N.S.ui.portal=N.S.ui.portal||{};N.S.ui.portal[p.id]={pin:'482113',days:30,exp:N.addDays(N.today(),30),inf:true,cot:false,pay:false,evi:true,rev:false};N.saveNow();const url=await N.portalUrl(p);return url.split('#/p/')[1]})()`);
const portalRun = async () => {
  await ev(`Object.keys(window.NURSE.PCACHE).forEach(k=>delete window.NURSE.PCACHE[k]);location.hash='#/p/${code}';1`); await sleep(1500);
  await ev(INJECT);
};
await portalRun(); await still('15_portal_pin');
await tap('#pinin', 200); for (const ch of '482113') { await ev(`window.__type1('#pinin',${J(ch)})`); await sleep(120); }
await tap('#pinbtn', 1700); await still('16_portal_inicio'); await scroll(520, 900); await still('17_portal_proxima_visita');
const tabs = await ev(`[...document.querySelectorAll('nav.tabs a')].map(a=>a.getAttribute('href')).join(',')`); console.log('  pestañas portal', tabs);
for (const [h, n] of [['historia', '18_portal_historial'], ['fotos', '19_portal_fotos'], ['informe', '20_portal_informe']]) { const ok = await ev(`!!document.querySelector('nav.tabs a[href$="/${h}"]')`); if (!ok) { problems.push('portal sin pestaña ' + h); continue; } await tap('nav.tabs a[href$="/' + h + '"]', 1300); await ev(`window.scrollTo(0,0);1`); await still(n); }

/* ---------- 3) clips (dsf 2, 780x1688) ---------- */
await dsf(2);
await send('Page.navigate', { url: BASE + '?c0=' + Date.now() + '#/hoy' }); await sleep(900);
await ev(INJECT);
const ids2 = (await ev(PREP)).split('|'); const patId2 = ids2[1];
await ev('window.NURSE.route();1'); await sleep(3600);
await record('clip1_cerrar_visita_informe_tarjeta', async () => {
  await ev(INJECT); await go('#/hoy', 700);
  await tap('[data-act=start]', 1100);
  await ev(`(()=>{const a=window.NURSE.A('hoyvisita');if(a&&a.record){a.record.start=new Date(Date.now()-35*60000).toISOString();window.NURSE.saveNow();window.NURSE.route()}return 1})()`); await sleep(500);
  await typ('[name=pa]', '124/78', 25); await typ('[name=fc]', '72', 25); await typ('[name=temp]', '36.6', 25); await typ('[name=sat]', '97', 25);
  await scroll(450, 500); await tap('text:sin sangrado', 250); await tap('text:sin dolor', 250);
  await scroll(99999, 500);
  await tap('button[type=submit]', 2200);
  await scroll(520, 1400); await scroll(1250, 1000);
}, 10.5);
await record('clip2_resumen_de_la_semana', async () => {
  await ev(INJECT); await go('#/resumen/' + patId2, 2200); await scroll(700, 1300); await scroll(1300, 1100);
}, 9);
const code2 = await ev(`(async()=>{const N=window.NURSE;const p=N.P(${J(patId2)});N.S.ui.portal=N.S.ui.portal||{};N.S.ui.portal[p.id]={pin:'482113',days:30,exp:N.addDays(N.today(),30),inf:true,cot:false,pay:false,evi:true,rev:false};N.saveNow();const url=await N.portalUrl(p);return url.split('#/p/')[1]})()`);
await record('clip3_familia_pin_proxima_visita_informe', async () => {
  await ev(`Object.keys(window.NURSE.PCACHE).forEach(k=>delete window.NURSE.PCACHE[k]);location.hash='#/p/${code2}';1`); await sleep(1300); await ev(INJECT);
  await tap('#pinin', 200); for (const ch of '482113') { await ev(`window.__type1('#pinin',${J(ch)})`); await sleep(210); }
  await tap('#pinbtn', 1500); await scroll(480, 1200);
  await tap('nav.tabs a[href$="/informe"]', 2200);
}, 10);
await send('Page.navigate', { url: BASE + '?c9=' + Date.now() }); await sleep(300);
await ev(`sessionStorage.clear();1`);
await record('clip4_entrada_electro', async () => { await send('Page.navigate', { url: BASE + '?c4=' + Date.now() + '#/hoy' }); await sleep(4300); }, 6);

/* tarjetas crudas */
await dsf(2); await send('Page.navigate', { url: BASE + '?t=' + Date.now() }); await sleep(2800); await ev(INJECT);
const ids3 = (await ev(PREP)).split('|');
const cards = JSON.parse(await ev(`(async()=>{const N=window.NURSE;const b64=b=>new Promise(res=>{const f=new FileReader();f.onload=()=>res(f.result.split(',')[1]);f.readAsDataURL(b)});const a=N.A(${J(ids3[0])});return JSON.stringify({r:await b64(await N.reportCard(a)),s:await b64(await N.summaryCard(N.P(${J(ids3[1])}),7))})})()`));
fs.writeFileSync(path.join(OUT, 'tarjeta_informe_1080x1350.png'), Buffer.from(cards.r, 'base64'));
fs.writeFileSync(path.join(OUT, 'tarjeta_resumen_semana_1080x1350.png'), Buffer.from(cards.s, 'base64'));
console.log('PROBLEMAS:', problems.length ? problems.join(' | ') : 'ninguno');
console.log('listo'); ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
