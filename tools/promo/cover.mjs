// Portada de historia destacada de Nurse App (1080x1920; el círculo del perfil recorta el centro).
// Uso: node tools/promo/cover.mjs <salida.png>   (requiere serve.js en :5173 y Chrome)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const OUT = path.resolve(process.argv[2]); fs.mkdirSync(path.dirname(OUT), { recursive: true });
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9349, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'cov-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: 'http://localhost:5173/?cover=' + Date.now() }); await sleep(2500);
await ev(`Promise.all([document.fonts.load('600 80px "Cormorant Garamond"'),document.fonts.load('italic 400 40px "Cormorant Garamond"'),document.fonts.load('700 40px "DM Sans"')]).then(()=>1)`);
const b64 = await ev(`(()=>{
const NV='#14275F',TQ='#2E9C8F',AQU='#9FD9CF';
const c=document.createElement('canvas');c.width=1080;c.height=1920;const x=c.getContext('2d');
const g=x.createLinearGradient(0,0,0,1920);g.addColorStop(0,'#1F3A8F');g.addColorStop(.5,'#14275F');g.addColorStop(1,'#0C1A44');x.fillStyle=g;x.fillRect(0,0,1080,1920);
x.strokeStyle='rgba(159,217,207,.07)';x.lineWidth=1;for(let i=0;i<=1080;i+=36){x.beginPath();x.moveTo(i,0);x.lineTo(i,1920);x.stroke()}for(let j=0;j<=1920;j+=36){x.beginPath();x.moveTo(0,j);x.lineTo(1080,j);x.stroke()}
// halo turquesa detrás del símbolo
const r=x.createRadialGradient(540,960,40,540,960,520);r.addColorStop(0,'rgba(46,156,143,.45)');r.addColorStop(1,'rgba(46,156,143,0)');x.fillStyle=r;x.fillRect(0,0,1080,1920);
// electro que cruza todo el ancho, por detrás del símbolo
x.save();x.strokeStyle='rgba(159,217,207,.30)';x.lineWidth=6;x.lineJoin='round';x.shadowColor=AQU;x.shadowBlur=26;const y=960;x.beginPath();x.moveTo(-10,y);x.lineTo(150,y);x.lineTo(185,y-30);x.lineTo(215,y+30);x.lineTo(250,y);x.lineTo(360,y);x.moveTo(720,y);x.lineTo(830,y);x.lineTo(870,y-45);x.lineTo(920,y);x.lineTo(1090,y);x.stroke();x.restore();
// símbolo (dentro del círculo seguro de ~620 px)
const cx=540,cy=960,R=250;x.save();x.lineCap='round';x.lineJoin='round';x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=30;x.lineWidth=18;x.strokeStyle='#fff';x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();x.shadowBlur=0;x.beginPath();x.moveTo(cx-R*.4,cy-R*.3);x.lineTo(cx,cy+R*.42);x.lineTo(cx+R*.4,cy-R*.3);x.stroke();x.strokeStyle=TQ;x.lineWidth=18;x.beginPath();x.moveTo(cx-R*.98,cy+R*.02);x.lineTo(cx-R*.62,cy+R*.02);x.lineTo(cx-R*.52,cy-R*.2);x.lineTo(cx-R*.4,cy+R*.24);x.lineTo(cx-R*.3,cy+R*.02);x.stroke();x.restore();
// texto (fuera del círculo: se ve en la historia, no en la portada del destacado)
x.textAlign='center';x.fillStyle='#fff';x.shadowColor='rgba(8,16,48,.6)';x.shadowBlur=20;x.font='600 128px "Cormorant Garamond"';x.fillText('Nurse App',540,1390);x.shadowBlur=0;
x.fillStyle=AQU;x.font='700 28px "DM Sans"';x.letterSpacing='9px';x.fillText('VALERIA · ENFERMERA A DOMICILIO',540,1456);x.letterSpacing='0px';
x.fillStyle='#E3EEF9';x.font='italic 400 54px "Cormorant Garamond"';x.fillText('Cada visita, bien registrada.',540,1570);x.fillText('Cada familia, informada.',540,1634);
x.fillStyle='rgba(159,180,214,.9)';x.font='400 22px "DM Sans"';x.fillText('Reg. N° 475283 · Emergencias: 131',540,1800);
return c.toDataURL('image/png').split(',')[1]})()`);
fs.writeFileSync(OUT, Buffer.from(b64, 'base64')); console.log('ok', OUT);
ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
