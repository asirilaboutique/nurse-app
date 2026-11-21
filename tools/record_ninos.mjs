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
const PORT = 9351, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'rca-'));
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


/* ===== Pack CUIDADO INFANTIL: datos ficticios (niño de ejemplo, sin rostros, sin montos) ===== */
const PREPK = `(async()=>{const N=window.NURSE;N.S=N.DEFAULTS();N.demo();const S=N.S;S.demo=false;S.lastBackup=Date.now();S.charges=[];S.quotes=[];
 S.profile.wa=S.profile.wa||'+56911112222';
 const p=S.patients.find(x=>x.svc==='Bebé y niño');p.name='Mateo, 3 años';p.age=3;p.consent=p.consent||{date:N.today()};p.drive='https://drive.google.com/drive/folders/ejemplo';p.resp={name:'Pamela Rojas',rel:'madre',phone:'+56 9 5555 0101'};
 S.appts=S.appts.filter(a=>a.patientId!==p.id);
 const mkimg=(c1,c2)=>new Promise(r=>{const c=document.createElement('canvas');c.width=900;c.height=700;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,900,700);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,900,700);x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(450,330,170,0,7);x.fill();c.toBlob(r,'image/jpeg',.8)});
 const past=[[6,'Contento','Todo',['Almuerzo','Colación'],'80',['Cuentos y lectura','Juego libre'],'Dijo «agua» por primera vez'],[4,'Tranquilo','Casi todo',['Almuerzo','Once'],'70',['Dibujo y pintura','Música y canto'],'Pintó con témpera sin ayuda'],[2,'Contento','Todo',['Almuerzo','Colación','Once'],'95',['Juego al aire libre','Estimulación motora'],'Saltó con los dos pies']];
 past.forEach(([ago,an,co,cm,si,ac,lg],i)=>{const d=N.addDays(N.today(),-ago);const kid={animo:an,comio:co,comidas:cm,siesta:si,panales:'3',bano:i!==1,acts:ac,logro:lg,inc:['Sin incidentes'],med:''};const a={id:'kp'+i,patientId:p.id,type:'Cuidado infantil · turno por horas',date:d,start:'10:00',dur:180,travel:15,price:0,status:'hecha',zone:p.zone,record:{start:d+'T10:00',end:d+'T13:00',vit:{},vig:['Sin incidentes'],kid},report:{family:'',obs:'',clinical:'x',approved:true,sent:true}};const g=N.kidFamily(a,p,a.record);a.report.family=g.texto;a.report.obs=g.obs;S.appts.push(a)});
 const cur={id:'kidhoy',patientId:p.id,type:'Cuidado infantil · turno por horas',date:N.today(),start:'10:00',dur:180,travel:15,price:0,status:'prog',zone:p.zone,record:null,report:null};S.appts.push(cur);
 S.appts.push({id:'kprox',patientId:p.id,type:'Cuidado infantil · turno por horas',date:N.addDays(N.today(),2),start:'10:00',dur:180,travel:15,price:0,status:'prog',zone:p.zone,record:null,report:null});
 const cd=S.appts.find(x=>x.id==='kp2');cd.media=[];await N.addMedia(cd,[await mkimg('#F7E3A1','#F1CFC8'),await mkimg('#D8EFE8','#E3EEF9')]);cd.media[0].cap='Hora del juego';cd.media[0].fam=true;cd.media[1].cap='Dibujo de hoy';cd.media[1].fam=true;
 N.saveNow();return 'kidhoy|'+p.id})()`;
const KFILL = `(()=>{const f=document.querySelector('form[data-form=visit]');const c=(n,v)=>{const e=f.querySelector('input[name='+n+'][value="'+v+'"]');if(e)e.click()};
 c('animo','Contento');c('comio','Casi todo');c('comidas','Almuerzo');c('comidas','Colación');
 c('acts','Cuentos y lectura');c('acts','Dibujo y pintura');c('acts','Juego sensorial');c('inc','Sin incidentes');return 1})()`;
const kidVisitFill = async () => {
  await sleep(100);
  await ev(`(()=>{const a=window.NURSE.A('kidhoy');if(a&&a.record){a.record.start=new Date(Date.now()-170*60000).toISOString();window.NURSE.saveNow();window.NURSE.route()}return 1})()`); await sleep(500); await ev(INJECT);
};

await send('Page.navigate', { url: BASE + '?fresh=' + Date.now() }); await sleep(900);
await ev(`sessionStorage.clear();1`);
await send('Page.navigate', { url: BASE + '?k1=' + Date.now() + '#/hoy' }); await sleep(4600);
await ev(INJECT);
const kids = (await ev(PREPK)).split('|'); const kPat = kids[1];
await send('Page.navigate', { url: BASE + '?k2=' + Date.now() + '#/hoy' }); await sleep(2800); await ev(INJECT);
await go('#/pacientes'); await still('K01_pacientes_servicios');
await go('#/ficha/' + kPat); await still('K02_ficha_nino');
await ev(`window.NURSE.startVisit('kidhoy');1`); await sleep(1200); await ev(INJECT);
await sleep(100);
await ev(`(()=>{const a=window.NURSE.A('kidhoy');if(a&&a.record){a.record.start=new Date(Date.now()-170*60000).toISOString();window.NURSE.saveNow();window.NURSE.route()}return 1})()`); await sleep(600); await ev(INJECT);
await still('K03_visita_infantil_inicio');
await ev(KFILL); await sleep(300);
await ev(`window.__setfield=1;(()=>{const f=document.querySelector('form[data-form=visit]');const s=(n,v)=>{const e=f.elements[n];e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};s('siesta','90');s('panales','3');f.elements.bano.click();s('logro','Armó una torre de 6 bloques');s('nota','Hoy quiso ayudar a ordenar sus juguetes.');return 1})()`); await sleep(300);
await ev(`document.querySelector('input[name=animo]').scrollIntoView({block:'start'});window.scrollBy(0,-90);1`); await sleep(400); await still('K04_visita_animo_comida');
await ev(`document.querySelector('input[name=siesta]').scrollIntoView({block:'start'});window.scrollBy(0,-90);1`); await sleep(400); await still('K05_visita_sueno_actividades');
await ev(`document.querySelector('input[name=inc]').scrollIntoView({block:'start'});window.scrollBy(0,-90);1`); await sleep(400); await still('K06_visita_incidentes_logro');
await ev(`window.NURSE.closeVisit(document.querySelector('form[data-form=visit]'));1`); await sleep(1500); await ev(`window.scrollTo(0,0);1`);
await still('K07_informe_familiar_infantil');
await ev(`document.querySelector('#cardimg').scrollIntoView({block:'center'});1`); await sleep(600); await still('K08_tarjeta_infantil');
await ev(`document.querySelector('#rptpaper').scrollIntoView({block:'start'});window.scrollBy(0,-20);1`); await sleep(400); await still('K09_texto_para_la_familia');
await go('#/resumen/' + kPat, 1500); await still('K10_resumen_semana_infantil');
await ev(`window.scrollBy(0,700);1`); await sleep(500); await still('K11_resumen_evolucion_mensaje');

/* portal de la familia */
const kcode = await ev(`(async()=>{const N=window.NURSE;const p=N.P(${J(kPat)});N.S.ui.portal=N.S.ui.portal||{};N.S.ui.portal[p.id]={pin:'482113',days:30,exp:N.addDays(N.today(),30),inf:true,cot:false,pay:false,evi:true,rev:false};N.saveNow();const url=await N.portalUrl(p);return url.split('#/p/')[1]})()`);
await send('Page.navigate', { url: BASE + '?kp=' + Date.now() + '#/p/' + kcode }); await sleep(2500); await ev(INJECT);
await setv('#pinin', '482113', 400); await tap('#pinbtn', 1700); await still('K12_portal_inicio_infantil');
for (const [h, n] of [['informe', 'K13_portal_informe_infantil'], ['fotos', 'K14_portal_fotos_infantil']]) { const ok = await ev(`!!document.querySelector('nav.tabs a[href$="/${h}"]')`); if (!ok) { problems.push('portal sin pestaña ' + h); continue; } await tap('nav.tabs a[href$="/' + h + '"]', 1300); await ev(`window.scrollTo(0,0);1`); await still(n); }

/* clip vertical: cerrar visita infantil → informe → tarjeta */
await dsf(2); await send('Page.navigate', { url: BASE + '?kc=' + Date.now() }); await sleep(2800); await ev(INJECT);
await ev(PREPK); await send('Page.navigate', { url: BASE + '?kc2=' + Date.now() + '#/visita/kidhoy' }); await sleep(2800); await ev(INJECT);
await record('KCLIP1_visita_infantil_informe_tarjeta', async () => {
  await ev(`window.NURSE.startVisit('kidhoy');1`); await sleep(1100);
  await ev(`(()=>{const a=window.NURSE.A('kidhoy');if(a&&a.record){a.record.start=new Date(Date.now()-170*60000).toISOString();window.NURSE.saveNow();window.NURSE.route()}return 1})()`); await sleep(500); await ev(INJECT);
  await ev(`document.querySelector('input[name=animo]').scrollIntoView({block:'start'});window.scrollBy(0,-90);1`); await sleep(500);
  for (const [n, v] of [['animo', 'Contento'], ['comio', 'Casi todo'], ['comidas', 'Almuerzo']]) { await tap(`input[name=${n}][value="${v}"]`, 380); }
  await ev(`document.querySelector('input[name=siesta]').scrollIntoView({block:'start'});window.scrollBy(0,-90);1`); await sleep(500);
  await setv('input[name=siesta]', '90', 350);
  for (const v of ['Cuentos y lectura', 'Dibujo y pintura', 'Juego sensorial']) { await tap(`input[name=acts][value="${v}"]`, 380); }
  await tap('input[name=inc][value="Sin incidentes"]', 450);
  await setv('input[name=logro]', 'Armó una torre de 6 bloques', 400);
  await ev(`window.NURSE.closeVisit(document.querySelector('form[data-form=visit]'));1`); await sleep(1600);
  await ev(`document.querySelector('#cardimg').scrollIntoView({block:'center',behavior:'smooth'});1`); await sleep(1800);
}, 14);

/* tarjetas crudas + lámina de integración con los servicios */
await dsf(2); await send('Page.navigate', { url: BASE + '?kt=' + Date.now() }); await sleep(2800); await ev(INJECT);
const k3 = (await ev(PREPK)).split('|');
await ev(`(async()=>{const N=window.NURSE;const a=N.A('kidhoy');a.status='hecha';a.record={start:N.today()+'T10:00',end:N.today()+'T13:00',vit:{},vig:['Sin incidentes'],kid:{animo:'Contento',comio:'Casi todo',comidas:['Almuerzo','Colación'],siesta:'90',panales:'3',bano:true,acts:['Cuentos y lectura','Dibujo y pintura','Juego sensorial'],logro:'Armó una torre de 6 bloques',inc:['Sin incidentes'],med:''}};const g=N.kidFamily(a,N.P(a.patientId),a.record);a.report={family:g.texto,obs:g.obs,clinical:N.kidClinical(a,N.P(a.patientId),a.record),approved:true,sent:false};N.saveNow();return 1})()`);
const kc = JSON.parse(await ev(`(async()=>{const N=window.NURSE;const b64=b=>new Promise(res=>{const f=new FileReader();f.onload=()=>res(f.result.split(',')[1]);f.readAsDataURL(b)});const a=N.A('kidhoy');return JSON.stringify({r:await b64(await N.reportCard(a)),s:await b64(await N.summaryCard(N.P(${J(k3[1])}),7))})})()`));
fs.writeFileSync(path.join(OUT, 'tarjeta_informe_infantil_1080x1350.png'), Buffer.from(kc.r, 'base64'));
fs.writeFileSync(path.join(OUT, 'tarjeta_resumen_semana_infantil_1080x1350.png'), Buffer.from(kc.s, 'base64'));
console.log('PROBLEMAS:', problems.length ? problems.join(' | ') : 'ninguno');
console.log('listo'); ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
