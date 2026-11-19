/* ============ EVOLUCIÓN Y RESUMEN DE LA SEMANA ============ */
const vnum=s=>{const m=String(s==null?'':s).replace(',','.').match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null};
function vitOf(a){const v=(a.record&&a.record.vit)||{};const pa=String(v.pa||'').match(/(\d+)\s*\/\s*(\d+)/);return {pas:pa?+pa[1]:null,pad:pa?+pa[2]:null,fc:vnum(v.fc),temp:vnum(v.temp),sat:vnum(v.sat)}}
function vitSeries(pid,upto,n,days){
 let l=S.appts.filter(a=>a.patientId===pid&&a.status==='hecha'&&a.record&&a.record.vit&&Object.values(a.record.vit).some(Boolean)).sort((x,y)=>(x.date+x.start).localeCompare(y.date+y.start));
 if(upto){const i=l.findIndex(a=>a.id===upto);if(i>=0)l=l.slice(0,i+1)}
 if(days){const lim=addDays(today(),-days);l=l.filter(a=>a.date>=lim)}
 return l.slice(-(n||6))}
const VDEF=[['pas','Presión (sistólica)','mmHg'],['fc','Pulso','lpm'],['temp','Temperatura','°C'],['sat','Saturación O₂','%']];
function vitDelta(series,k){const vals=series.map(a=>vitOf(a)[k]).filter(x=>x!==null);if(vals.length<2)return null;return Math.round((vals[vals.length-1]-vals[vals.length-2])*10)/10}
const dShort=d=>d===null?'':d===0?'igual':(d>0?'+':'−')+Math.abs(d);
function sparkSvg(vals,w,h,col){const v=vals.filter(x=>x!==null);if(v.length<2)return '';const mn=Math.min(...v),mx=Math.max(...v),rg=(mx-mn)||1,p=4;
 const pts=v.map((y,i)=>[p+i*(w-2*p)/(v.length-1),h-p-(y-mn)/rg*(h-2*p)]);
 return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" style="flex:none"><polyline fill="none" stroke="${col||'#2E9C8F'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pts.map(q=>q.map(z=>z.toFixed(1)).join(',')).join(' ')}"/><circle cx="${pts[pts.length-1][0].toFixed(1)}" cy="${pts[pts.length-1][1].toFixed(1)}" r="4" fill="${col||'#2E9C8F'}"/></svg>`}
function evoBox(pid,upto,days,title){
 const ser=vitSeries(pid,upto,6,days);if(!ser.length)return '';
 const rows=VDEF.map(([k,lb,un])=>{const vals=ser.map(a=>vitOf(a)[k]);const last=[...vals].reverse().find(x=>x!==null);if(last===undefined)return '';const d=vitDelta(ser,k);
  return `<div class="row sp" style="min-height:48px;gap:10px"><div class="grow"><div class="xs mut">${lb}</div><b style="font-size:20px">${last} <span class="xs mut" style="font-weight:400">${un}</span></b></div>${d===null?'':`<span class="pill ${d===0?'p-mut':'p-warn'}">${dShort(d)}</span>`}${sparkSvg(vals,96,34)}</div>`}).join('');
 return `<section class="card col noprint" id="evobox"><div class="row sp"><b>${title||'Evolución de signos vitales'}</b><span class="pill p-mut">${ser.length} visita${ser.length===1?'':'s'}</span></div>${rows}<div class="xs mut">${ser.length<2?'Con la próxima visita aparece la comparación.':'Son los valores que registraste; la lectura clínica es tuya.'}</div></section>`}
function vitTable(pid,upto){const ser=vitSeries(pid,upto,6);if(!ser.length)return '';
 return `<table id="vittable" style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px"><thead><tr style="text-align:left;color:#4C5A7A"><th>Fecha</th><th>PA</th><th>FC</th><th>T°</th><th>SatO₂</th></tr></thead><tbody>${ser.map(a=>{const v=a.record.vit;return `<tr style="border-top:1px solid #E5DACA"><td>${fdate(a.date)}</td><td>${esc(v.pa||'—')}</td><td>${esc(v.fc||'—')}</td><td>${esc(v.temp||'—')}</td><td>${esc(v.sat||'—')}</td></tr>`}).join('')}</tbody></table>`}
function periodStats(pid,days){
 const lim=addDays(today(),-days);const vis=S.appts.filter(a=>a.patientId===pid&&a.status==='hecha'&&a.date>=lim).sort((x,y)=>(x.date+x.start).localeCompare(y.date+y.start));
 const vig={};vis.forEach(a=>((a.record&&a.record.vig)||[]).filter(s=>s!=='Otro').forEach(s=>vig[s]=(vig[s]||0)+1));
 const mins=vis.reduce((s,a)=>s+((a.record&&a.record.start&&a.record.end)?Math.max(1,Math.round((new Date(a.record.end)-new Date(a.record.start))/60000)):(a.dur||0)),0);
 return {vis,n:vis.length,sent:vis.filter(a=>a.report&&a.report.sent).length,mins,vig:Object.entries(vig).sort((a,b)=>b[1]-a[1]).slice(0,6),ser:vitSeries(pid,null,8,days)}}
const perName=d=>d<=7?'de la semana':d<=14?'de 2 semanas':'del mes';
function summaryText(p,days){const st=periodStats(p.id,days);const f=p.name.split(/[ ,]/)[0];
 if(!st.n)return `Aún no hay visitas en los últimos ${days} días.`;
 const h=Math.floor(st.mins/60);
 return `Resumen ${perName(days)} de ${f}: ${st.n} visita${st.n===1?'':'s'} (${h?h+' h ':''}${st.mins%60} min de cuidado). `+(st.vig.length?`Lo que más se vigiló: ${st.vig.map(x=>x[0].toLowerCase()+' ('+x[1]+')').join(', ')}. `:'')+'Registré sus signos vitales en cada visita. Ante cualquier cambio, escríbeme; en una emergencia llama al 131.'}
async function summaryCard(p,days){
 await fontsReady();const st=periodStats(p.id,days);const first=p.name.split(/[ ,]/)[0];
 const [c,x]=newCv(1080,1350);
 x.fillStyle='#F7F3EC';x.fillRect(0,0,1080,1350);
 const g=x.createLinearGradient(0,0,1080,300);g.addColorStop(0,'#14275F');g.addColorStop(1,'#1F3A8F');x.fillStyle=g;x.fillRect(0,0,1080,270);
 x.strokeStyle='rgba(159,217,207,.10)';x.lineWidth=1;for(let i=0;i<=1080;i+=36){x.beginPath();x.moveTo(i,0);x.lineTo(i,270);x.stroke()}for(let j=0;j<=270;j+=36){x.beginPath();x.moveTo(0,j);x.lineTo(1080,j);x.stroke()}
 isoLogo(x,120,135,52,'#fff');T(x,'Valeria',200,128,'600 62px "Cormorant Garamond", serif','#fff');T(x,'ENFERMERA A DOMICILIO',202,170,'700 20px "DM Sans", sans-serif',AQU,'left',5);
 T(x,'RESUMEN DEL CUIDADO',1010,112,'700 20px "DM Sans", sans-serif',AQU,'right',4);T(x,days+' días hasta '+fdate(today()),1010,152,'400 28px "DM Sans", sans-serif','#E3EEF9','right');
 let y=370;T(x,'Cómo va '+first,70,y,'600 88px "Cormorant Garamond", serif',NV);
 y+=48;T(x,'Resumen '+perName(days)+' · '+st.n+' visita'+(st.n===1?'':'s'),72,y,'500 30px "DM Sans", sans-serif','#4C5A7A');
 y+=40;const hh=Math.floor(st.mins/60),mm=st.mins%60;
 const stats=[['VISITAS',String(st.n),'realizadas'],['CUIDADO',hh?hh+' h '+mm:mm+' min','con '+first],['INFORMES',String(st.sent),'enviados']];
 const w3=(940-2*16)/3;stats.forEach((s,i)=>{const X=70+i*(w3+16);rr(x,X,y,w3,140,26);x.fillStyle='#fff';x.fill();x.strokeStyle='#E5DACA';x.lineWidth=2;x.stroke();T(x,s[0],X+w3/2,y+40,'700 19px "DM Sans", sans-serif',TQ,'center',3);T(x,s[1],X+w3/2,y+95,'700 50px "DM Sans", sans-serif',NV,'center');T(x,s[2],X+w3/2,y+126,'400 19px "DM Sans", sans-serif','#7A869F','center')});
 y+=140+30;
 const pan=VDEF.map(([k,lb,un])=>({k,lb,un,vals:st.ser.map(a=>vitOf(a)[k])})).filter(q=>q.vals.some(v=>v!==null));
 if(pan.length){const pw=(940-16)/2,ph=190;pan.slice(0,4).forEach((q,i)=>{const X=70+(i%2)*(pw+16),Y=y+Math.floor(i/2)*(ph+16);rr(x,X,Y,pw,ph,26);x.fillStyle='#fff';x.fill();x.strokeStyle='#E5DACA';x.lineWidth=2;x.stroke();
  T(x,q.lb.toUpperCase(),X+26,Y+42,'700 18px "DM Sans", sans-serif',TQ,'left',2);const v=q.vals.filter(a=>a!==null);const last=v[v.length-1];T(x,String(last),X+26,Y+104,'700 56px "DM Sans", sans-serif',NV);x.font='700 56px "DM Sans", sans-serif';const lw=x.measureText(String(last)).width;T(x,q.un,X+26+lw+10,Y+104,'400 22px "DM Sans", sans-serif','#7A869F');
  const d=v.length>1?Math.round((last-v[v.length-2])*10)/10:null;if(d!==null)T(x,(d===0?'igual que antes':dShort(d)+' vs. anterior'),X+26,Y+146,'600 22px "DM Sans", sans-serif',d===0?'#7A869F':TER);else T(x,'primer registro',X+26,Y+146,'400 22px "DM Sans", sans-serif','#7A869F');
  if(v.length>1){const mn=Math.min(...v),mx=Math.max(...v),rg=(mx-mn)||1,gx=X+pw-250,gw=220,gy=Y+40,gh=100;x.save();x.strokeStyle=TQ;x.lineWidth=5;x.lineCap='round';x.lineJoin='round';x.beginPath();v.forEach((val,j)=>{const px=gx+j*gw/(v.length-1),py=gy+gh-(val-mn)/rg*gh;j?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();const lx=gx+gw,ly=gy+gh-(last-mn)/rg*gh;x.fillStyle=TQ;x.beginPath();x.arc(lx,ly,9,0,7);x.fill();x.restore()}});
  y+=Math.ceil(Math.min(4,pan.length)/2)*(190+16)+14}
 const ch=st.vig;if(ch.length){T(x,'LO QUE MÁS VIGILÉ',72,y+22,'700 20px "DM Sans", sans-serif',TQ,'left',3);y+=44;let cx=70;x.font='600 26px "DM Sans", sans-serif';ch.forEach(([s,n])=>{const lab=s+' ×'+n;const w=x.measureText(lab).width+64;if(cx+w>1010){cx=70;y+=62}rr(x,cx,y,w,50,25);x.fillStyle='#DDF1EC';x.fill();T(x,'✓',cx+22,y+34,'700 26px "DM Sans", sans-serif',TQ);T(x,lab,cx+46,y+34,'600 26px "DM Sans", sans-serif',NV);cx+=w+12});y+=70}
 if(!st.n){T(x,'Aún no hay visitas en este período.',70,y+30,'400 32px "DM Sans", sans-serif','#4C5A7A')}
 x.fillStyle=NV;x.fillRect(0,1210,1080,140);isoLogo(x,96,1280,34,'#fff');
 T(x,(S.profile.name||'Valeria')+' · Enfermera · Reg. N° '+(S.profile.reg||''),150,1272,'600 26px "DM Sans", sans-serif','#fff');T(x,S.profile.tagline||'Cuidados que acompañan. En cada etapa de la vida.',150,1312,'italic 400 27px "Cormorant Garamond", serif',AQU);
 T(x,'Emergencia: 131',1010,1292,'700 22px "DM Sans", sans-serif',COR,'right');
 return toBlob(c)}
routes.resumen=([id])=>{
 const p=P(id);if(!p)return `${back('Pacientes','#/pacientes')}${empty('Paciente no encontrada.')}`;
 const days=S.ui.rdays||7;const st=periodStats(p.id,days);
 return `${back('Ficha','#/ficha/'+p.id)}<h2 style="margin:4px 0 4px">Resumen del cuidado</h2><div class="sm mut" style="margin-bottom:10px">${esc(p.name)}</div>
 <div class="seg" style="margin-bottom:12px">${[[7,'7 días'],[14,'14 días'],[30,'30 días']].map(d=>`<button class="${days===d[0]?'on':''}" data-act="rdays" data-d="${d[0]}">${d[1]}</button>`).join('')}</div>
 <div class="col">
 ${st.n?'':'<div class="alert a-warn">No hay visitas realizadas en este período. Prueba con más días.</div>'}
 ${cardBox('resumen',p.id,!p.consent)}
 ${evoBox(p.id,null,days,'Evolución en el período')}
 <section class="card col noprint"><b>Mensaje para la familia</b><div class="paper sm" id="sumtxt" style="white-space:pre-line">${esc(summaryText(p,days))}</div><div class="row"><button class="btn sec grow" data-act="copy" data-t="${esc(summaryText(p,days))}">Copiar mensaje</button></div><div class="xs mut">${p.consent?'Tú eliges a quién enviarlo desde el menú de compartir.':'<b>Sin consentimiento firmado:</b> el botón de compartir queda bloqueado. Fírmalo en la ficha.'}</div></section>
 </div>`};
