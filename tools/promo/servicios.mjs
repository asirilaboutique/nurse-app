// Lámina "Nurse App en cada servicio" (1080x1350 y 1080x1920). Uso: node tools/promo/servicios.mjs <carpeta salida>  (requiere serve.js :5173 y Chrome)
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const OUT = path.resolve(process.argv[2]); fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9353, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'svc-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value; };
await send('Page.enable'); await send('Page.navigate', { url: 'http://localhost:5173/?svc=' + Date.now() }); await sleep(2500);
await ev(`Promise.all(['600 80px "Cormorant Garamond"','italic 400 40px "Cormorant Garamond"','700 30px "DM Sans"','400 30px "DM Sans"'].map(f=>document.fonts.load(f))).then(()=>1)`);
for (const [name, W, H] of [['lamina_servicios_1080x1350.png', 1080, 1350], ['lamina_servicios_historia_1080x1920.png', 1080, 1920]]) {
  const b64 = await ev(`(()=>{const W=${W},H=${H};const NV='#14275F',TQ='#2E9C8F',AQU='#9FD9CF';const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1F3A8F');g.addColorStop(.55,'#14275F');g.addColorStop(1,'#0C1A44');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle='rgba(159,217,207,.07)';for(let i=0;i<=W;i+=36){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke()}for(let j=0;j<=H;j+=36){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke()}
  const T=(t,X,Y,f,col,al,sp)=>{x.font=f;x.fillStyle=col;x.textAlign=al||'left';x.letterSpacing=(sp||0)+'px';x.fillText(t,X,Y);x.letterSpacing='0px'};
  const top=H===1350?0:150;
  T('NURSE APP · EN CADA SERVICIO',70,110+top,'700 24px "DM Sans"',AQU,'left',6);
  T('Cada etapa de la vida,',70,210+top,'600 78px "Cormorant Garamond"','#fff');T('su propio registro.',70,292+top,'italic 400 78px "Cormorant Garamond"','#E3EEF9');
  const S=[['Adulto mayor','#D8EFE8','#0F4F47',['Signos vitales y su evolución','Medicación según indicación','Resumen semanal familiar']],['Bebé y niño','#F7E3A1','#5C4A0A',['Ánimo, comidas y siesta','Actividades y logros del día','Incidentes y aviso a la familia']],['Paliativo','#CFC6EA','#3E2F6B',['Confort y acompañamiento','Qué observar en casa','Informe claro para cada visita']],['Procedimientos','#E3EEF9','#14275F',['Inyecciones y curaciones','Sitio, rotación y vigilancia','Fotos solo con permiso']]];
  const cw=(W-140-24)/2,ch=H===1350?310:380,y0=H===1350?360:540;
  S.forEach((s,i)=>{const X=70+(i%2)*(cw+24),Y=y0+Math.floor(i/2)*(ch+24);x.fillStyle='rgba(255,255,255,.07)';x.beginPath();x.roundRect(X,Y,cw,ch,28);x.fill();x.fillStyle=s[1];x.beginPath();x.roundRect(X+24,Y+26,cw-48,56,28);x.fill();T(s[0],X+cw/2,Y+64,'700 28px "DM Sans"',s[2],'center');
   s[3].forEach((l,k)=>{const yy=Y+140+k*(H===1350?52:66);x.fillStyle=TQ;x.beginPath();x.arc(X+40,yy-9,8,0,7);x.fill();x.font='500 25px "DM Sans"';let t=l;while(x.measureText(t).width>cw-90)t=t.slice(0,-1);T(t,X+62,yy,'500 25px "DM Sans"','#E8F0FA')})});
  const fy=y0+2*(ch+24)+30;
  T('Cada visita termina en un informe para la familia.',W/2,fy+30,'italic 400 40px "Cormorant Garamond"','#E3EEF9','center');T('Tú lo revisas y lo apruebas antes de enviarlo.',W/2,fy+80,'italic 400 40px "Cormorant Garamond"','#E3EEF9','center');
  T('Valeria · Enfermera a domicilio · Reg. N° 475283',W/2,H-90,'600 24px "DM Sans"','#fff','center');T('Cuidados que acompañan. En cada etapa de la vida.',W/2,H-52,'italic 400 26px "Cormorant Garamond"',AQU,'center');
  return c.toDataURL('image/png').split(',')[1]})()`);
  fs.writeFileSync(path.join(OUT, name), Buffer.from(b64, 'base64')); console.log('ok', name);
}
ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
