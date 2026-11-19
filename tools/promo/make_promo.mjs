// Video promo profesional de Nurse App (vertical 1080x1920, ~42 s) a partir de las tomas V_ACTUAL.
// Uso: node tools/promo/make_promo.mjs <carpeta V_ACTUAL> <carpeta de trabajo> <salida.mp4>   (requiere serve.js en :5173, Chrome y ffmpeg)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const SRC = path.resolve(process.argv[2]), W = path.resolve(process.argv[3]), OUTF = path.resolve(process.argv[4]);
fs.mkdirSync(W, { recursive: true }); fs.mkdirSync(path.dirname(OUTF), { recursive: true });
const FF = process.env.FFMPEG || 'ffmpeg';
const CHROME = process.env.CHROME || 'C:/Users/ASIRI/AppData/Local/Google/Chrome/Application/chrome.exe';
const MUSIC = process.env.MUSIC || 'C:/Users/ASIRI/Desktop/ASIRI/AGENCIA/carolina/reel_instructivo/musica_piano.mp3';
const LATIDO = process.env.LATIDO || 'C:/Users/ASIRI/Desktop/ASIRI/AGENCIA/carolina/reel_instructivo/ENTREGABLES/latido_real.mp3';
const ff = (...a) => execFileSync(FF, ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' });

/* ---------- 1) piezas gráficas con las tipografías de la marca (render en Chrome) ---------- */
const PORT = 9347, udir = fs.mkdtempSync(path.join(os.tmpdir(), 'pro-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + udir, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tab; for (let i = 0; i < 40; i++) { try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await sleep(300); } }
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: 'http://localhost:5173/?promo=' + Date.now() }); await sleep(2500);
await ev(`Promise.all([document.fonts.load('600 80px "Cormorant Garamond"'),document.fonts.load('italic 400 40px "Cormorant Garamond"'),document.fonts.load('700 40px "DM Sans"'),document.fonts.load('400 40px "DM Sans"')]).then(()=>1)`);
const GFX = `(()=>{
const NV='#14275F',AZ='#1F3A8F',TQ='#2E9C8F',AQU='#9FD9CF',TER='#C9785D';
const mk=()=>{const c=document.createElement('canvas');c.width=1080;c.height=1920;return [c,c.getContext('2d')]};
const rr=(x,X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
const grid=(x,col)=>{x.strokeStyle=col;x.lineWidth=1;for(let i=0;i<=1080;i+=36){x.beginPath();x.moveTo(i,0);x.lineTo(i,1920);x.stroke()}for(let j=0;j<=1920;j+=36){x.beginPath();x.moveTo(0,j);x.lineTo(1080,j);x.stroke()}};
const ecg=(x,y,a,w)=>{x.save();x.strokeStyle='rgba(159,217,207,'+a+')';x.lineWidth=w;x.lineJoin='round';x.shadowColor=AQU;x.shadowBlur=26;x.beginPath();x.moveTo(-10,y);x.lineTo(250,y);x.lineTo(285,y-34);x.lineTo(320,y+34);x.lineTo(355,y);x.lineTo(430,y);x.lineTo(470,y-210);x.lineTo(515,y+130);x.lineTo(555,y-40);x.lineTo(595,y);x.lineTo(700,y);x.lineTo(745,y-48);x.lineTo(800,y);x.lineTo(1090,y);x.stroke();x.restore()};
const logo=(x,cx,cy,r,col)=>{x.save();x.lineCap='round';x.lineJoin='round';x.lineWidth=Math.max(3,r*.07);x.strokeStyle=col;x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.beginPath();x.moveTo(cx-r*.4,cy-r*.3);x.lineTo(cx,cy+r*.42);x.lineTo(cx+r*.4,cy-r*.3);x.stroke();x.strokeStyle=TQ;x.beginPath();x.moveTo(cx-r*.98,cy+r*.02);x.lineTo(cx-r*.62,cy+r*.02);x.lineTo(cx-r*.52,cy-r*.2);x.lineTo(cx-r*.4,cy+r*.24);x.lineTo(cx-r*.3,cy+r*.02);x.stroke();x.restore()};
const wrap=(x,t,mw)=>{const w=t.split(' ');const L=[];let l='';w.forEach(q=>{const n=l?l+' '+q:q;if(x.measureText(n).width>mw&&l){L.push(l);l=q}else l=n});if(l)L.push(l);return L};
const out=c=>c.toDataURL('image/png').split(',')[1];
const A={};
// fondo con degradado, grilla y electro tenue
{const [c,x]=mk();const g=x.createLinearGradient(0,0,0,1920);g.addColorStop(0,'#1F3A8F');g.addColorStop(.5,'#14275F');g.addColorStop(1,'#0C1A44');x.fillStyle=g;x.fillRect(0,0,1080,1920);grid(x,'rgba(159,217,207,.06)');ecg(x,980,.20,5);A.bg=out(c)}
// fondo con halo para escenas con teléfono
{const [c,x]=mk();const g=x.createLinearGradient(0,0,0,1920);g.addColorStop(0,'#1F3A8F');g.addColorStop(.55,'#14275F');g.addColorStop(1,'#0C1A44');x.fillStyle=g;x.fillRect(0,0,1080,1920);grid(x,'rgba(159,217,207,.055)');const r=x.createRadialGradient(540,1090,60,540,1090,760);r.addColorStop(0,'rgba(46,156,143,.34)');r.addColorStop(1,'rgba(46,156,143,0)');x.fillStyle=r;x.fillRect(0,0,1080,1920);ecg(x,260,.14,4);A.bgp=out(c)}
// marco del teléfono (transparente con ventana de pantalla)
{const [c,x]=mk();const X=202,Y=380,w=676,h=1421;x.shadowColor='rgba(0,0,0,.55)';x.shadowBlur=60;x.shadowOffsetY=26;rr(x,X,Y,w,h,78);x.fillStyle='#0B1433';x.fill();x.shadowColor='transparent';rr(x,X,Y,w,h,78);x.strokeStyle='rgba(159,217,207,.35)';x.lineWidth=3;x.stroke();x.globalCompositeOperation='destination-out';rr(x,X+18,Y+18,640,1385,62);x.fill();x.globalCompositeOperation='source-over';rr(x,X+18,Y+18,640,1385,62);x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=2;x.stroke();rr(x,540-62,Y+30,124,26,13);x.fillStyle='#0B1433';x.fill();A.frame=out(c)}
// leyendas
const cap=(t,sub)=>{const [c,x]=mk();x.textAlign='center';x.shadowColor='rgba(8,16,48,.65)';x.shadowBlur=22;x.fillStyle='#fff';x.font='600 76px "Cormorant Garamond"';let L=wrap(x,t,900);if(L.length>2){x.font='600 64px "Cormorant Garamond"';L=wrap(x,t,920)}const y0=L.length===1?218:178;L.forEach((l,i)=>x.fillText(l,540,y0+i*82));if(sub){x.shadowBlur=0;x.fillStyle=AQU;x.font='700 24px "DM Sans"';x.letterSpacing='5px';x.fillText(sub.toUpperCase(),540,y0+L.length*82+30)}return out(c)};
A.c_hoy=cap('Tu día, ordenado.','Agenda y visitas');
A.c_v1=cap('Registras la visita…','Signos vitales y vigilancia');
A.c_v2=cap('…y el informe se arma solo.','Texto claro para la familia');
A.c_v3=cap('Tú lo revisas y lo apruebas.','Nada sale sin tu aprobación');
A.c_card=cap('Una tarjeta lista para compartir.','Se envía por WhatsApp');
A.c_res=cap('Cada semana, un resumen para la familia.','Evolución a la vista');
A.c_p1=cap('La familia entra con su PIN…','Portal privado y cifrado');
A.c_p2=cap('…ve la próxima visita…','');
A.c_p3=cap('…y lee el informe.','Con el número de emergencia siempre a mano');
// tarjeta de apertura
{const [c,x]=mk();x.textAlign='center';x.shadowColor='rgba(8,16,48,.6)';x.shadowBlur=24;x.fillStyle='#fff';x.font='600 118px "Cormorant Garamond"';x.fillText('Cada visita,',540,830);x.fillText('bien registrada.',540,960);x.shadowBlur=0;x.fillStyle=AQU;x.font='italic 400 62px "Cormorant Garamond"';x.fillText('Cada familia, informada.',540,1100);x.fillStyle='rgba(159,217,207,.9)';x.font='700 24px "DM Sans"';x.letterSpacing='7px';x.fillText('NURSE APP',540,1290);A.hook=out(c)}
// cierre
{const [c,x]=mk();logo(x,540,640,150,'#fff');x.textAlign='center';x.fillStyle='#fff';x.font='600 120px "Cormorant Garamond"';x.fillText('Valeria',540,950);x.fillStyle=AQU;x.font='700 28px "DM Sans"';x.letterSpacing='9px';x.fillText('ENFERMERA A DOMICILIO',540,1010);x.letterSpacing='0px';x.fillStyle='#E3EEF9';x.font='italic 400 52px "Cormorant Garamond"';x.fillText('Cuidados que acompañan.',540,1150);x.fillText('En cada etapa de la vida.',540,1216);x.fillStyle='rgba(159,180,214,.9)';x.font='400 22px "DM Sans"';wrap(x,'Imágenes con datos de ejemplo. La app apoya el trabajo; no reemplaza el criterio clínico. Emergencias: 131.',860).forEach((l,i)=>x.fillText(l,540,1700+i*32));x.fillStyle=AQU;x.font='700 22px "DM Sans"';x.letterSpacing='4px';x.fillText('REG. N° 475283',540,1620);A.end=out(c)}
return JSON.stringify(A)})()`;
const A = JSON.parse(await ev(GFX));
for (const [k, v] of Object.entries(A)) fs.writeFileSync(path.join(W, k + '.png'), Buffer.from(v, 'base64'));
ws.close(); proc.kill(); try { fs.rmSync(udir, { recursive: true, force: true }); } catch {}
console.log('gráficas listas:', Object.keys(A).join(', '));

/* ---------- 2) escenas ---------- */
const P = f => path.join(W, f + '.png');
const CL = f => path.join(SRC, 'clips', f + '.mp4');
const CP = f => path.join(SRC, 'capturas', f + '.png');
const FR = 30;
const scenes = [];
const capIn = (i, d, st) => `[${i}:v]format=rgba,fade=t=in:st=0:d=0.35:alpha=1,fade=t=out:st=${(d - .35).toFixed(2)}:d=0.35:alpha=1,setpts=PTS+${st}/TB[cap${i}]`;
function phoneScene(name, inputs, screenFilter, caps, dur) {
  // inputs: pantallas (video/imagen) ya escaladas por screenFilter; caps: [[png, inicio, fin]]
  const args = ['-f', 'lavfi', '-i', `color=c=0x14275F:s=1080x1920:r=${FR}`, '-loop', '1', '-framerate', String(FR), '-t', String(dur), '-i', P('bgp'), ...inputs.flatMap(x => x), '-loop', '1', '-framerate', String(FR), '-t', String(dur), '-i', P('frame')];
  const nIn = inputs.length; const frameIdx = 2 + nIn;
  let capIdx = frameIdx + 1; let f = `[1:v]format=yuv420p[bg];${screenFilter};[bg][scr]overlay=220:398:shortest=0[t1];[t1][${frameIdx}:v]overlay=0:0[t2]`;
  let last = 't2';
  caps.forEach(([png, a, b], k) => { args.push('-loop', '1', '-framerate', String(FR), '-t', String((b - a).toFixed(2)), '-i', P(png)); const d = b - a; f += `;[${capIdx}:v]format=rgba,fade=t=in:st=0:d=0.35:alpha=1,fade=t=out:st=${(d - .35).toFixed(2)}:d=0.35:alpha=1,setpts=PTS+${a}/TB[cp${k}];[${last}][cp${k}]overlay=0:0:eof_action=pass[o${k}]`; last = 'o' + k; capIdx++; });
  const o = path.join(W, name + '.mp4');
  ff(...args, '-filter_complex', f, '-map', `[${last}]`, '-t', String(dur), '-r', String(FR), '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p', o);
  return { f: o, d: dur };
}
const vidScreen = (clip, dur, ss = 0) => [['-ss', String(ss), '-t', String(dur), '-i', CL(clip)]];
const cropScr = idx => `[${idx}:v]crop=832:1800:124:60,scale=640:1385:flags=lanczos,fps=${FR},format=yuv420p,setsar=1[scr]`;

// A) apertura con el electro de la app
{ const o = path.join(W, 'sA.mp4'); ff('-t', '5', '-i', CL('clip4_entrada_electro'), '-vf', `fps=${FR},format=yuv420p,fade=t=out:st=4.5:d=0.5`, '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p', o); scenes.push({ f: o, d: 5 }); }
// B) frase de apertura
{ const o = path.join(W, 'sB.mp4'); const d = 3.6;
  ff('-loop', '1', '-framerate', String(FR), '-t', String(d), '-i', P('bg'), '-loop', '1', '-framerate', String(FR), '-t', String(d), '-i', P('hook'), '-filter_complex', `[0:v]format=yuv420p[b];[1:v]format=rgba,fade=t=in:st=0.25:d=0.6:alpha=1,fade=t=out:st=${d - .5}:d=0.4:alpha=1[h];[b][h]overlay=0:0,zoompan=z='1+0.02*on/${d * FR}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FR},format=yuv420p`, '-t', String(d), '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p', o); scenes.push({ f: o, d }); }
// C) Hoy: dos pantallas con transición dentro del teléfono
scenes.push(phoneScene('sC', [['-loop', '1', '-framerate', String(FR), '-t', '5', '-i', CP('01_hoy_inicio')], ['-loop', '1', '-framerate', String(FR), '-t', '5', '-i', CP('02_hoy_agenda_del_dia')]],
  `[2:v]scale=640:1385:flags=lanczos,fps=${FR},format=yuv420p,setsar=1[s1];[3:v]scale=640:1385:flags=lanczos,fps=${FR},format=yuv420p,setsar=1[s2];[s1][s2]xfade=transition=slideup:duration=0.7:offset=2.1[scr]`, [['c_hoy', .3, 4.9]], 5));
// D) visita -> informe -> tarjeta
scenes.push(phoneScene('sD', vidScreen('clip1_cerrar_visita_informe_tarjeta', 10.4), cropScr(2), [['c_v1', .2, 3.4], ['c_v2', 3.5, 6.9], ['c_v3', 7.0, 10.3]], 10.4));
// E) la tarjeta para compartir, grande
{ const o = path.join(W, 'sE.mp4'); const d = 3.8;
  ff('-loop', '1', '-framerate', String(FR), '-t', String(d), '-i', P('bgp'), '-loop', '1', '-framerate', String(FR), '-t', String(d), '-i', path.join(SRC, 'tarjeta_informe_1080x1350.png'), '-loop', '1', '-framerate', String(FR), '-t', String(d), '-i', P('c_card'),
    '-filter_complex', `[0:v]format=yuv420p[b];[1:v]format=rgba,scale=w='760+50*t/${d}':h=-1:eval=frame[card];[b][card]overlay=x=(W-w)/2:y=(H-h)/2+120:shortest=0[t];[2:v]format=rgba,fade=t=in:st=0:d=0.4:alpha=1,fade=t=out:st=${d - .4}:d=0.4:alpha=1[cp];[t][cp]overlay=0:0:eof_action=pass,format=yuv420p`, '-t', String(d), '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p', o); scenes.push({ f: o, d }); }
// F) resumen de la semana
scenes.push(phoneScene('sF', vidScreen('clip2_resumen_de_la_semana', 5.2), cropScr(2), [['c_res', .2, 5.0]], 5.2));
// G) portal de la familia
scenes.push(phoneScene('sG', vidScreen('clip3_familia_pin_proxima_visita_informe', 8.1), cropScr(2), [['c_p1', .2, 3.5], ['c_p2', 3.7, 6.0], ['c_p3', 6.1, 8.0]], 8.1));
// H) cierre
{ const o = path.join(W, 'sH.mp4'); const d = 4.6;
  ff('-loop', '1', '-framerate', String(FR), '-t', String(d), '-i', P('bg'), '-loop', '1', '-framerate', String(FR), '-t', String(d), '-i', P('end'), '-filter_complex', `[0:v]format=yuv420p[b];[1:v]format=rgba,fade=t=in:st=0.2:d=0.7:alpha=1,fade=t=out:st=${d - .6}:d=0.6:alpha=1[e];[b][e]overlay=0:0,format=yuv420p`, '-t', String(d), '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p', o); scenes.push({ f: o, d }); }

/* ---------- 3) unión con fundidos ---------- */
const XF = .4; let args = []; scenes.forEach(s => args.push('-i', s.f));
let f = '', prev = '[0:v]', acc = scenes[0].d;
for (let i = 1; i < scenes.length; i++) { const off = acc - XF; f += `${prev}[${i}:v]xfade=transition=fade:duration=${XF}:offset=${off.toFixed(3)}[v${i}];`; prev = `[v${i}]`; acc = acc + scenes[i].d - XF; }
const total = acc; console.log('duración total', total.toFixed(1), 's');
const silent = path.join(W, 'silent.mp4');
ff(...args, '-filter_complex', f.slice(0, -1), '-map', prev, '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', String(FR), silent);

/* ---------- 4) audio: piano propio + latido en la apertura y el cierre ---------- */
const aud = path.join(W, 'audio.m4a');
ff('-i', MUSIC, '-i', LATIDO, '-i', LATIDO, '-filter_complex',
  `[0:a]atrim=start=4:duration=${(total + 1).toFixed(2)},asetpts=PTS-STARTPTS,volume=0.6,afade=t=in:st=0:d=2.2,afade=t=out:st=${(total - 3.2).toFixed(2)}:d=3[m];[1:a]volume=1.1,adelay=250|250[l1];[2:a]volume=0.9,adelay=${Math.round((total - 4.2) * 1000)}|${Math.round((total - 4.2) * 1000)}[l2];[m][l1][l2]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,atrim=duration=${total.toFixed(2)}[a]`, '-map', '[a]', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', aud);
ff('-i', silent, '-i', aud, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', '-shortest', OUTF);
console.log('listo →', OUTF);
