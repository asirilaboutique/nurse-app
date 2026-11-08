// Genera capturas de la app en formato teléfono (390x844 @3x) para material de la agencia.
// Uso: node tools/shots.mjs <carpeta de salida>   (requiere serve.js en :5173 y Chrome)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const OUT = process.argv[2] || './screens';
fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:5173/';
const PORT = 9333;
const udir = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let tab;
for (let i = 0; i < 40; i++) {
  try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); }
}
if (!tab) { proc.kill(); throw new Error('Chrome no respondió'); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('ok', name); };

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await send('Page.navigate', { url: BASE }); await sleep(3500);

// Datos de ejemplo limpios (sin cartel de "datos de ejemplo")
const prep = `(()=>{const N=window.NURSE;N.S=N.DEFAULTS();N.demo();N.S.demo=false;N.S.lastBackup=Date.now();
 N.S.profile.bank='Banco Estado · Cuenta RUT · a nombre de Valeria';
 document.querySelectorAll('.splash').forEach(e=>e.remove());return N.S.patients.map(p=>p.name).join('|')})()`;
console.log(await ev(prep));
const go = async (hash, setup = '', wait = 500) => { if (setup) await ev(setup); await ev(`location.hash=${JSON.stringify(hash)};window.NURSE.route();window.scrollTo(0,0);1`); await sleep(wait); };
const scrollTo = async sel => { await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-12);return 1})()`); await sleep(250); };

await go('#/hoy'); await shot('01_hoy');
await ev(`(()=>{const e=[...document.querySelectorAll('section')].find(s=>/Por enviar hoy/.test(s.innerText));if(e)e.scrollIntoView({block:'start'});window.scrollBy(0,-16)})()`); await sleep(300); await shot('02_por_enviar_hoy');
await go('#/agenda'); await shot('03_agenda');
await go('#/voz', `window.NURSE.S.ui.voz=window.NURSE.parsePhrase('Agenda a Don Hernán el viernes a las 9, visita de curación');window.NURSE.S.ui.paste=null`); await shot('04_agendar_por_frase');
await go('#/voz', `window.NURSE.S.ui.voz=null;window.NURSE.S.ui.paste=window.NURSE.parseLeadMsg('Hola, soy María Soto, mi mamá Rosa tiene 82 años y necesita curaciones. Mi cel +56 9 8765 4321')`);
await scrollTo('form[data-form="paste"]'); await shot('05_pegar_mensaje_whatsapp');
// visita en curso
const vid = await ev(`(()=>{const N=window.NURSE;const a=N.S.appts.find(x=>x.status==='prog'&&x.date===N.today())||N.S.appts.find(x=>x.status==='prog');return a?a.id:''})()`);
if (vid) { await ev(`window.NURSE.startVisit(${JSON.stringify(vid)});1`); await sleep(500); await go('#/visita/' + vid); await shot('06_visita_en_curso'); }
// informe familiar de una visita hecha
const iid = await ev(`(()=>{const N=window.NURSE;const a=N.S.appts.find(x=>x.status==='hecha'&&x.report);return a?a.id:''})()`);
if (iid) { await go('#/informe/' + iid); await shot('07_informe_familiar'); }
// Evidencia (fotos de ejemplo dibujadas, no son pacientes)
if (iid) {
  await ev(`(async()=>{const N=window.NURSE;const a=N.A(${JSON.stringify(iid)});
   const mk=(c1,c2)=>new Promise(r=>{const c=document.createElement('canvas');c.width=900;c.height=700;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,900,700);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,900,700);x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(450,330,170,0,7);x.fill();x.fillStyle='rgba(255,255,255,.55)';x.font='42px sans-serif';x.textAlign='center';x.fillText('Foto de ejemplo',450,600);c.toBlob(b=>r(new File([b],'e.png',{type:'image/png'})),'image/png')});
   a.media=[];await N.addMedia(a,[await mk('#E3EEF9','#2E9C8F'),await mk('#F4EBDD','#C9785D')]);
   a.media[0].cap='Herida limpia, bordes sanos';a.media[0].fam=true;a.media[1].cap='Curación terminada';a.media[1].fam=true;
   N.P(a.patientId).drive='https://drive.google.com/drive/folders/ejemplo';return 1})()`);
  await go('#/informe/' + iid); await sleep(700);
  await sleep(3200); await scrollTo('#mediabox'); await shot('21_evidencia_en_la_visita');
}
await go('#/cobros'); await shot('08_cobros');
const qid = await ev(`(()=>{const q=window.NURSE.S.quotes[0];return q?q.id:''})()`);
if (qid) { await go('#/cotizacion/' + qid); await shot('09_cotizacion'); }
await go('#/disponibilidad'); await shot('10_horas_disponibles_9x16');
await go('#/panel'); await shot('11_panel_ventas');
await go('#/embudo'); await shot('12_clientes_embudo');
await go('#/ajustes'); await scrollTo('#bakpass'); await shot('13_respaldo_cifrado');

// Portal familiar (cifrado con PIN)
const PIN = '482113';
const portal = `(async()=>{const N=window.NURSE;const p=N.S.patients.find(x=>N.S.appts.some(a=>a.patientId===x.id&&a.status==='hecha'&&a.report))||N.S.patients[0];
 const done=N.S.appts.filter(a=>a.patientId===p.id&&a.status==='hecha');
 const txt=['Tomó su tratamiento sin molestias y comió bien. Todo en orden.','La herida sigue cerrando como esperábamos. Sin señales de alerta.','Se sintió con más energía hoy. Seguimos con la misma indicación.'];
 done.forEach((a,i)=>{a.report=a.report||{family:'',obs:''};a.report.family=txt[i%3];a.report.obs=a.report.obs||'Mantener hidratación y avisar si aparece fiebre.';a.report.approved=true});
 N.S.ui.portal={};N.S.ui.portal[p.id]={pin:'${PIN}',days:30,exp:N.addDays(N.today(),30),inf:true,cot:true,pay:true,rev:false};
 const url=await N.portalUrl(p);const code=url.split('#/p/')[1];const env=N.b64d(code.split('/')[0]);N.PCACHE[env.s]=await N.openPortal(env,'${PIN}');return code})()`;
const code = await ev(portal);
// pantalla de PIN (sin datos)
await ev(`(()=>{Object.keys(window.NURSE.PCACHE).forEach(k=>delete window.NURSE.PCACHE[k]);location.hash='#/p/${code}';return 1})()`); await sleep(700); await shot('14_portal_pin');
await ev(`(async()=>{const N=window.NURSE;const env=N.b64d(${JSON.stringify(code)}.split('/')[0]);N.PCACHE[env.s]=await N.openPortal(env,'${PIN}');return 1})()`);
for (const [tab, name] of [['inicio', '15_portal_inicio'], ['historia', '16_portal_historia'], ['informe', '17_portal_informe'], ['cuidado', '18_portal_cuidado'], ['pagos', '19_portal_pagos'], ['fotos', '22_portal_fotos'], ['mensaje', '20_portal_mensaje']]) {
  await ev(`location.hash='#/p/${code}/${tab}';1`); await sleep(500); await shot(name);
}
// Pantalla de bienvenida
await send('Page.navigate', { url: BASE + '?s=' + Date.now() }); await sleep(300);
await ev(`sessionStorage.removeItem('splash');1`);
await send('Page.reload'); await sleep(1100); await shot('00_bienvenida');

ws.close(); proc.kill();
try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
