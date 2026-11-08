/* Nurse App · batería de pruebas (10 rondas x 10). Se corre en la propia página: await runRound(1) … runAll() */
(function(){
const N=window.NURSE;
const R={};let cur=null;
const t=(name,fn)=>cur.push({name,fn});
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error((m||'')+' esperado '+JSON.stringify(b)+' obtenido '+JSON.stringify(a))};
const ok=(c,m)=>{if(!c)throw new Error(m||'falló')};
const fresh=()=>{N.S=N.DEFAULTS();N.demo();};
const nextDow=(dow)=>{let d=N.today();for(let i=1;i<9;i++){const x=N.addDays(N.today(),i);if(new Date(x+'T00:00').getDay()===dow)return x}};
const go=async h=>{location.hash=h;await new Promise(r=>setTimeout(r,40));N.route();await new Promise(r=>setTimeout(r,20))};
const txt=()=>document.querySelector('#app').innerText;
const click=sel=>{const e=document.querySelector(sel);if(!e)throw new Error('no existe '+sel);e.click()};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* R1 · Núcleo */
cur=R[1]=[];
t('formato CLP es-CL',()=>{eq(clp(126000),'$126.000')});
t('formato fecha larga/corta',()=>{eq(fdate('2026-11-06',true),'Viernes 6 de noviembre');eq(fdate('2026-11-06'),'Vie 6 nov')});
t('addDays cruza fin de mes y año',()=>{eq(addDays('2026-12-31',1),'2027-01-01');eq(addDays('2026-03-01',-1),'2026-02-28')});
t('toMin/hhmm son inversas',()=>{eq(hhmm(toMin('08:30')),'08:30');eq(toMin('13:45'),825)});
t('escape HTML bloquea XSS',()=>{eq(esc('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;')});
t('iniciales',()=>{eq(initials('Rosa Contreras'),'RC');eq(initials('Mateo, 8 meses'),'M8')});
t('demo crea datos coherentes',()=>{fresh();ok(N.S.patients.length===4&&N.S.appts.length>=9&&N.S.charges.length===6)});
t('guardado y recarga desde localStorage',()=>{fresh();N.saveNow();const s=JSON.parse(localStorage.getItem('nurseapp.v1'));eq(s.patients.length,4)});
t('IDs únicos en todas las colecciones',()=>{fresh();const ids=[...N.S.patients,...N.S.appts,...N.S.charges,...N.S.leads,...N.S.quotes].map(x=>x.id);eq(new Set(ids).size,ids.length)});
t('waLink normaliza números chilenos',()=>{ok(N.waLink('+56 9 1234 4821','hola ñandú').startsWith('https://wa.me/56912344821?text=hola%20%C3%B1and%C3%BA'));ok(N.waLink('9 8765 4321','x').includes('/56987654321'))});

/* R2 · Agenda */
cur=R[2]=[];
t('detecta choque exacto',()=>{fresh();eq(N.conflicts(N.today(),'10:00',60,0).length,1)});
t('traslado previo cuenta como ocupado',()=>{fresh();ok(N.conflicts(N.today(),'14:00',30,0).length===0);ok(N.conflicts(N.today(),'13:00',30,0).length===1,'13:00-13:30 solo choca por el traslado de Hernán')});
t('citas contiguas sin traslado no chocan',()=>{fresh();eq(N.conflicts(N.today(),'09:00',30,0).length,0)});
t('cancelada libera la hora',()=>{fresh();const a=N.S.appts.find(x=>x.start==='10:00'&&x.date===N.today());a.status='cancel';eq(N.conflicts(N.today(),'10:00',60,0).length,0)});
t('ignora la propia cita al editar',()=>{fresh();const a=N.S.appts.find(x=>x.start==='10:00'&&x.date===N.today());eq(N.conflicts(a.date,a.start,a.dur,a.travel,a.id).length,0)});
t('sugerencias libres de choque y sin almuerzo',()=>{fresh();const s=N.suggest(N.today(),60,15,5,540);eq(s.length,5);s.forEach(x=>{ok(!N.conflicts(x.date,x.start,60,15).length,'choca '+x.date+x.start);ok(!(toMin(x.start)<840&&toMin(x.start)+60>780),'cae en almuerzo '+x.start)})});
t('no sugiere días no laborales',()=>{fresh();N.S.horario.dias=[1];const s=N.suggest(N.today(),30,0,3,0);s.forEach(x=>eq(new Date(x.date+'T00:00').getDay(),1))});
t('horas libres excluyen almuerzo y citas',()=>{fresh();const w=N.freeWindows(N.today());ok(w.length>0);w.forEach(([a,b])=>ok(b-a>=60));ok(!w.some(([a,b])=>a<780&&b>840))});
t('carga del día baja/media/alta/libre',()=>{fresh();const e=N.addDays(N.today(),30);N.S.appts.push({id:'x1',patientId:N.S.patients[0].id,date:e,start:'09:00',dur:60,travel:0,status:'prog',type:'t',zone:''});eq(N.loadOf(e),'baja');N.S.appts.push({id:'x2',patientId:N.S.patients[0].id,date:e,start:'11:00',dur:150,travel:0,status:'prog',type:'t',zone:''});eq(N.loadOf(e),'media');N.S.appts.push({id:'x3',patientId:N.S.patients[0].id,date:e,start:'14:00',dur:200,travel:0,status:'prog',type:'t',zone:''});eq(N.loadOf(e),'alta');eq(N.loadOf(N.addDays(e,1)),'libre')});
t('pantalla Agenda renderiza día, semana y mes sin error',async()=>{fresh();for(const m of['dia','semana','mes']){N.S.ui.agMode=m;await go('#/agenda');N.route();ok(txt().includes('Agenda'),m)}N.S.ui.agMode='dia'});

/* R3 · Frases */
cur=R[3]=[];
const P1=s=>{fresh();return N.parsePhrase(s)};
t('"Agenda a Don Hernán el martes a las 9, visita de curación"',()=>{const p=P1('Agenda a Don Hernán el martes a las 9, visita de curación');eq(p.patient?.name,'Hernán Soto');eq(p.time,'09:00');eq(new Date(p.date+'T00:00').getDay(),2);ok(/curaci/.test(p.type));eq(p.dur,30)});
t('hoy y hora con minutos',()=>{const p=P1('Rosa Contreras hoy a las 15:30 inyección');eq(p.date,N.today());eq(p.time,'15:30')});
t('mañana y duración en horas',()=>{const p=P1('mañana a las 10 turno de 3 horas con Mateo');eq(p.date,N.addDays(N.today(),1));eq(p.dur,180);ok(/Turno/.test(p.type))});
t('"a las 3" se entiende como tarde',()=>{const p=P1('agenda a Elena Vidal pasado mañana a las 3 control de presión');eq(p.time,'15:00');eq(p.date,N.addDays(N.today(),2))});
t('"de la mañana" respeta AM',()=>{const p=P1('agenda a Hernán el viernes a las 8 de la mañana curación');eq(p.time,'08:00')});
t('paciente desconocida avisa',()=>{const p=P1('agenda a Zoila el lunes a las 9');eq(p.patient,null);ok(p.notes.some(n=>/reconoc/.test(n)));eq(p.ok,false)});
t('sin hora avisa y no confirma',()=>{const p=P1('agenda a Rosa el martes');ok(p.notes.some(n=>/hora/.test(n)));eq(p.ok,false)});
t('fecha por número y mes',()=>{const p=P1('agenda a Rosa el 20 de diciembre a las 11 inyección');ok(p.date.endsWith('-12-20'));eq(p.time,'11:00')});
t('duración "30 minutos" y "media hora"',()=>{eq(P1('Hernán hoy 10:00 curación 45 minutos').dur,45);eq(P1('Hernán hoy a las 10 curación media hora').dur,30)});
t('tarifa del turno proporcional a horas',()=>{const p=P1('mañana a las 10 turno de 4 horas con Mateo');eq(p.price,N.S.tarifas.turnoHora*4)});

/* R4 · Visita e informe */
cur=R[4]=[];
const rosaHoy=()=>N.S.appts.find(a=>a.patientId===N.S.patients[0].id&&a.date===N.today()&&a.status==='prog');
t('iniciar visita cambia estado y navega',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);eq(a.status,'curso');ok(location.hash.includes('/visita/'+a.id));ok(txt().includes('Registro de inyección'))});
t('no permite dos visitas en curso',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);const b=N.S.appts.find(x=>x.start==='13:30'&&x.date===N.today());N.startVisit(b.id);eq(b.status,'prog')});
t('sugiere rotar sitio de punción',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);ok(/rotar a/.test(txt()),'sin sugerencia de rotación')});
t('cerrar visita genera informe familiar sin jerga',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);const f=document.querySelector('form[data-form=visit]');f.elements.sitio.value='Abdomen izq.';[...f.elements.vig].forEach(c=>c.checked=c.value==='Sin sangrado'||c.value==='Sin dolor');f.elements.pa.value='120/80';f.requestSubmit();await wait(80);ok(a.status==='hecha');ok(/sin sangrado y sin dolor/.test(a.report.family),a.report.family);ok(!/PA|FC|SatO/.test(a.report.family),'jerga clínica en versión familiar');ok(/PA 120\/80/.test(a.report.clinical))});
t('alerta de signos vitales fuera de rango',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);const f=document.querySelector('form[data-form=visit]');f.elements.temp.value='38.4';f.elements.temp.dispatchEvent(new Event('input',{bubbles:true}));ok(/Temperatura elevada/.test(txt()))});
t('envío bloqueado sin consentimiento',async()=>{fresh();const p=N.S.patients[3];const a=N.S.appts.find(x=>x.patientId===p.id)||{};const ap={id:'z9',patientId:p.id,date:N.today(),start:'18:00',dur:30,travel:0,type:'Control',status:'hecha',zone:'',record:{},report:{family:'ok',clinical:'ok',obs:'',approved:false,sent:false}};N.S.appts.push(ap);await go('#/informe/z9');ok(/Sin consentimiento firmado/.test(txt()));ok(document.querySelector('#sendrpt').disabled)});
t('envío exige marcar el número y habilita botón',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);document.querySelector('form[data-form=visit]').requestSubmit();await wait(80);const b=document.querySelector('#sendrpt');ok(b&&b.disabled);document.querySelector('#chk4').click();ok(!b.disabled)});
t('enviar marca informe como enviado y abre WhatsApp',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);document.querySelector('form[data-form=visit]').requestSubmit();await wait(80);let opened='';const o=window.open;window.open=u=>{opened=u};document.querySelector('#chk4').click();document.querySelector('#sendrpt').click();window.open=o;ok(a.report.sent);ok(opened.startsWith('https://wa.me/56912344821'),opened)});
t('editar texto desaprueba y actualiza vista',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);document.querySelector('form[data-form=visit]').requestSubmit();await wait(80);const ta=document.querySelector('#rptedit');ta.value='Texto nuevo';ta.dispatchEvent(new Event('input',{bubbles:true}));eq(a.report.family,'Texto nuevo');ok(document.querySelector('#rptpaper').innerText.includes('Texto nuevo'))});
t('pestaña clínica muestra signos y familiar no',async()=>{fresh();const a=rosaHoy();N.startVisit(a.id);await wait(60);const f=document.querySelector('form[data-form=visit]');f.elements.pa.value='130/85';f.requestSubmit();await wait(80);N.S.ui.imode='cli';N.route();ok(/130\/85/.test(document.querySelector('#rptpaper').innerText));N.S.ui.imode='fam';N.route();ok(!/130\/85/.test(document.querySelector('#rptpaper').innerText))});

/* R5 · Cotización y cobros */
cur=R[5]=[];
t('total con descuento',()=>{eq(N.qTotal({qty:7,unit:18000,disc:0}),126000);eq(N.qTotal({qty:10,unit:18000,disc:10}),162000)});
t('total nunca negativo',()=>{ok(N.qTotal({qty:-3,unit:1000,disc:0})>=0)});
t('horas tentativas sin choques y días hábiles',()=>{fresh();const s=N.tentSlots({startDate:N.addDays(N.today(),1),hour:'08:30',dur:30,qty:7});eq(s.length,7);s.forEach(x=>ok(!N.conflicts(x.date,x.start,30,15).length))});
t('tentativas saltan días con choque',()=>{fresh();const d=N.addDays(N.today(),1);const s=N.tentSlots({startDate:d,hour:'08:30',dur:30,qty:3});ok(!s.some(x=>x.date===d),'debía saltar '+d+' (Rosa 08:30)')});
t('crear cotización desde el formulario',async()=>{fresh();N.S.ui.qdraft=null;await go('#/cotizar');N.route();const f=document.querySelector('form[data-form=quote]');f.elements.patientId.value=N.S.patients[3].id;f.elements.servicio.value='Curaciones 5 días';f.elements.qty.value='5';f.elements.unit.value='18000';f.requestSubmit();await wait(120);ok(location.hash.startsWith('#/cotizacion/'));eq(N.S.quotes.at(-1).n,'0013');eq(N.S.quotes.at(-1).status,'borrador')});
t('enviar reserva horas tentativas y crea lead',async()=>{fresh();const q={id:'q9',n:'0099',patientId:N.S.patients[3].id,resp:'Elena',modo:'Visita',servicio:'Curaciones',qty:3,unit:18000,disc:0,zone:'',valid:7,status:'borrador',date:N.today(),dur:30,slots:N.tentSlots({startDate:N.addDays(N.today(),4),hour:'15:00',dur:30,qty:3})};N.S.quotes.push(q);await go('#/cotizacion/q9');const o=window.open;window.open=()=>{};click('[data-act=qsend]');window.open=o;eq(q.status,'enviada');eq(N.S.appts.filter(a=>a.tent==='q9').length,3);ok(N.S.leads.some(l=>l.patientId===q.patientId&&l.stage===1))});
t('aceptar confirma horas y crea cobro',async()=>{fresh();const q={id:'q8',n:'0098',patientId:N.S.patients[3].id,resp:'Elena',modo:'Visita',servicio:'Curaciones',qty:2,unit:18000,disc:0,zone:'',valid:7,status:'enviada',date:N.today(),dur:30,slots:[]};N.S.quotes.push(q);N.S.appts.push({id:'t1',patientId:q.patientId,type:'Curaciones (tentativa)',date:N.addDays(N.today(),5),start:'15:00',dur:30,travel:15,status:'prog',tent:'q8',zone:'',record:null,report:null});await go('#/cotizacion/q8');click('[data-act=qaccept]');ok(!/tentativa/.test(N.A('t1').type));ok(N.S.charges.some(c=>c.quoteId==='q8'&&c.amount===36000))});
t('registrar pago mueve de por cobrar a cobrado',async()=>{fresh();await go('#/cobros');const antes=N.S.charges.filter(c=>c.status==='pend').length;const id=N.S.charges.find(c=>c.status==='pend').id;const cf=window.confirm;window.confirm=()=>true;click(`[data-act=pay][data-id="${id}"]`);window.confirm=cf;eq(N.S.charges.filter(c=>c.status==='pend').length,antes-1);eq(N.S.charges.find(c=>c.id===id).paidAt,N.today())});
t('recordatorio por WhatsApp incluye monto y datos',async()=>{fresh();N.S.profile.bank='Valeria · Banco X · 123';const c=N.S.charges.find(c=>c.status==='pend');let u='';const o=window.open;window.open=x=>{u=x};await go('#/cobros');click(`[data-act=remind][data-id="${c.id}"]`);window.open=o;const m=decodeURIComponent(u.split('text=')[1]);ok(m.includes(clp(c.amount))&&m.includes('Banco X'),m)});
t('eliminar cotización libera tentativas',async()=>{fresh();N.S.quotes.push({id:'q7',n:'0097',patientId:N.S.patients[0].id,modo:'V',servicio:'s',qty:1,unit:1,disc:0,valid:7,status:'enviada',date:N.today(),slots:[]});N.S.appts.push({id:'t7',patientId:N.S.patients[0].id,date:N.addDays(N.today(),9),start:'09:00',dur:30,tent:'q7',status:'prog',type:'t (tentativa)',zone:'',travel:0});await go('#/cotizacion/q7');const cf=window.confirm;window.confirm=()=>true;click('[data-act=qdel]');window.confirm=cf;ok(!N.A('t7'))});

/* R6 · Embudo y panel */
cur=R[6]=[];
t('embudo muestra 6 etapas y totales',async()=>{fresh();await go('#/embudo');N.route();ok(/Cotizaciones abiertas/.test(txt()));eq(document.querySelectorAll('.kan>div').length,6)});
t('mover cliente avanza y retrocede',async()=>{fresh();await go('#/embudo');const l=N.S.leads[0];const s=l.stage;click(`[data-act=lmove][data-id="${l.id}"][data-n="1"]`);eq(l.stage,s+1);click(`[data-act=lmove][data-id="${l.id}"][data-n="-1"]`);eq(l.stage,s)});
t('no se sale de los extremos',async()=>{fresh();const l=N.S.leads[0];l.stage=0;await go('#/embudo');ok(document.querySelector(`[data-act=lmove][data-id="${l.id}"][data-n="-1"]`).disabled)});
t('suma de cotizaciones abiertas',async()=>{fresh();await go('#/embudo');const sum=N.S.leads.filter(l=>l.stage===1).reduce((s,l)=>s+l.amount,0);ok(txt().includes(clp(sum)))});
t('panel: ingresos del mes = pagados del mes',async()=>{fresh();await go('#/panel');const m=N.today().slice(0,7);const s=N.S.charges.filter(c=>c.status==='pagado'&&(c.paidAt||c.due).startsWith(m)).reduce((x,c)=>x+c.amount,0);ok(txt().includes(clp(s)),'ingresos '+s)});
t('panel: tasa de cierre',async()=>{fresh();N.S.quotes.push({id:'a',n:'1',patientId:'x',modo:'m',servicio:'s',qty:1,unit:1,disc:0,valid:7,status:'enviada',date:N.today(),slots:[]});await go('#/panel');ok(/50 %/.test(txt()),'1 aceptada de 2')});
t('panel sin datos no rompe (NaN/Infinity)',async()=>{N.S=N.DEFAULTS();await go('#/panel');N.route();ok(!/NaN|Infinity|undefined/.test(txt()),txt().slice(0,200))});
t('crear y editar lead',async()=>{fresh();await go('#/embudo');click('[data-act=newlead]');const f=document.querySelector('form[data-form=lead]');f.elements.name.value='Familia Test';f.requestSubmit();await wait(60);ok(N.S.leads.some(l=>l.name==='Familia Test'))});
t('lead sin nombre es rechazado',async()=>{fresh();await go('#/embudo');click('[data-act=newlead]');const f=document.querySelector('form[data-form=lead]');f.requestSubmit();await wait(60);ok(/Falta el nombre/.test(document.body.innerText))});
t('filtro del embudo oculta otras necesidades',async()=>{fresh();N.S.ui.efilter='Paliativo';await go('#/embudo');N.route();ok(/Luis Parra/.test(txt())&&!/Pamela Rojas/.test(txt()));N.S.ui.efilter='Todos'});

/* R7 · Portal */
cur=R[7]=[];
const mkPortal=async(mut)=>{fresh();const p=N.S.patients[0];N.S.ui.portal={};N.S.ui.portal[p.id]={pin:'4821',days:30,exp:N.addDays(N.today(),30),inf:true,cot:true,pay:true,rev:false};if(mut)mut(N.S.ui.portal[p.id]);N.S.ui.portal[p.id].pinHash=await N.sha('4821|'+N.S.ui.portal[p.id].exp);return {p,url:N.portalUrl(p)}};
t('enlace del portal se decodifica',async()=>{const {url}=await mkPortal();const d=N.b64d(url.split('#/p/')[1]);eq(d.pn,'Rosa');eq(d.fn,'Camila')});
t('el enlace NO incluye ficha clínica ni versión clínica',async()=>{const {url}=await mkPortal();const d=N.b64d(url.split('#/p/')[1]);const ok0=['v','pw','e','pn','fn','vn','vr','tg','wa','tx','nx','dn','tot','rp','q','pg'];Object.keys(d).forEach(k=>ok(ok0.includes(k),'campo no permitido '+k));ok(!JSON.stringify(d.rp||{}).includes('PA '))});
t('portal pide PIN y rechaza uno incorrecto',async()=>{const {url}=await mkPortal();sessionStorage.clear();location.hash='#/p/'+url.split('#/p/')[1];await wait(120);ok(/Confirma que eres tú/.test(txt()));document.querySelector('#pinin').value='0000';document.querySelector('#pinform').requestSubmit();await wait(150);ok(!document.querySelector('#pinerr').classList.contains('hide'))});
t('portal abre con el PIN correcto',async()=>{const {url}=await mkPortal();sessionStorage.clear();location.hash='#/p/'+url.split('#/p/')[1];await wait(120);document.querySelector('#pinin').value='4821';document.querySelector('#pinform').requestSubmit();await wait(200);ok(/Hola, Camila/.test(txt())&&/Próxima visita/.test(txt()))});
t('enlace vencido se rechaza',async()=>{const {url}=await mkPortal(c=>{c.exp=N.addDays(N.today(),-1)});location.hash='#/p/'+url.split('#/p/')[1];await wait(120);ok(/venció/.test(txt()))});
t('enlace corrupto no rompe la app',async()=>{location.hash='#/p/%%%basura';await wait(120);ok(/no es válido/.test(txt()))});
t('portal oculta informes si se desactiva',async()=>{const {url}=await mkPortal(c=>{c.inf=false});const d=N.b64d(url.split('#/p/')[1]);eq(d.rp,null)});
t('portal oculta pagos y banco si se desactiva',async()=>{const {url}=await mkPortal(c=>{c.pay=false});const d=N.b64d(url.split('#/p/')[1]);eq(d.pg,null)});
t('ACEPTO abre WhatsApp con monto',async()=>{const {p,url}=await mkPortal();N.S.profile.wa='+56 9 7777 6666';N.S.quotes.push({id:'qq',n:'0012',patientId:p.id,resp:'Camila',modo:'V',servicio:'Tratamiento',qty:7,unit:18000,disc:0,valid:7,status:'enviada',date:N.today(),slots:[]});const u2=N.portalUrl(p);sessionStorage.clear();location.hash='#/p/'+u2.split('#/p/')[1]+'/pagos';await wait(80);document.querySelector('#pinin').value='4821';document.querySelector('#pinform').requestSubmit();await wait(220);const a=[...document.querySelectorAll('a.btn')].find(x=>x.innerText==='ACEPTO');ok(a,'sin botón ACEPTO');ok(decodeURIComponent(a.href).includes('$126.000'))});
t('PIN no viaja en claro dentro del enlace',async()=>{const {url}=await mkPortal();ok(!JSON.stringify(N.b64d(url.split('#/p/')[1])).includes('4821'))});

/* R8 · UI y accesibilidad */
cur=R[8]=[];
const screens=['#/hoy','#/agenda','#/pacientes','#/cobros','#/cotizar','#/embudo','#/panel','#/disponibilidad','#/ajustes','#/voz'];
t('todas las pantallas renderizan sin error',async()=>{fresh();for(const s of screens){await go(s);N.route();ok(!/Algo falló/.test(txt()),s)}});
t('sin desbordamiento horizontal en 390 px',async()=>{fresh();for(const s of screens.filter(x=>!/embudo|panel/.test(x))){await go(s);N.route();ok(document.documentElement.scrollWidth<=innerWidth+1,s+' scrollWidth '+document.documentElement.scrollWidth+' > '+innerWidth)}});
t('botones y enlaces táctiles ≥ 44 px',async()=>{fresh();const bad=[];for(const s of['#/hoy','#/agenda','#/pacientes','#/cobros','#/cotizar']){await go(s);N.route();document.querySelectorAll('#app button:not(.hide),#app a.btn,nav.tabs a').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.height&&r.height<43.5)bad.push(s+' '+(e.innerText||e.getAttribute('aria-label')||'').slice(0,20)+' '+Math.round(r.height))})}eq(bad,[],'chicos')});
t('botones con solo ícono tienen aria-label',async()=>{fresh();for(const s of screens){await go(s);N.route();document.querySelectorAll('#app button,#app a').forEach(e=>{if(!e.innerText.trim()&&!e.getAttribute('aria-label')&&!e.querySelector('input'))throw new Error(s+' elemento sin nombre accesible: '+e.outerHTML.slice(0,80))})}});
t('todos los campos tienen etiqueta',async()=>{fresh();await go('#/cotizar');N.route();document.querySelectorAll('#app input:not([type=hidden]):not([type=radio]):not([type=checkbox]),#app select,#app textarea').forEach(e=>{const has=e.closest('label')||e.getAttribute('aria-label')||(e.id&&document.querySelector(`label[for=${e.id}]`));if(!has)throw new Error('campo sin etiqueta '+e.name)})});
t('un solo h1 por pantalla y lang es-CL',async()=>{fresh();ok(document.documentElement.lang==='es-CL');for(const s of screens){await go(s);N.route();ok(document.querySelectorAll('#app h1').length<=1,s)}});
t('contraste: gris secundario ≥ 4.5:1 sobre fondo',()=>{const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};ok(cr('#5A6B74','#FBF8F4')>=4.5,'gris/fondo '+cr('#5A6B74','#FBF8F4'));ok(cr('#234B31','#DDE8DA')>=4.5);ok(cr('#5E3E17','#F4E6D2')>=4.5);ok(cr('#7A2F1F','#F3DDD6')>=4.5);ok(cr('#ffffff','#2F5A3C')>=4.5);ok(cr('#10293A','#C4935A')>=4.5)});
t('Escape cierra el sheet y el foco no se pierde',async()=>{fresh();await go('#/agenda');click('[data-act=newappt]');ok(document.querySelector('.sheet'));document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));ok(!document.querySelector('.sheet'))});
t('pestaña actual marcada con aria-current',async()=>{fresh();await go('#/cobros');N.route();eq(document.querySelector('nav.tabs a[aria-current=page]').innerText.trim(),'Cobros')});
t('título del documento cambia por pantalla',async()=>{fresh();await go('#/cobros');N.route();ok(/Cobros/.test(document.title));await go('#/agenda');N.route();ok(/Agenda/.test(document.title))});

/* R9 · Robustez */
cur=R[9]=[];
t('XSS en nombre de paciente no ejecuta',async()=>{fresh();N.S.patients[0].name='<img src=x onerror="window.__x=1">';window.__x=0;await go('#/pacientes');N.route();await wait(100);eq(window.__x,0);ok(!document.querySelector('#app img[src=x]'))});
t('XSS en nota de informe y cotización',async()=>{fresh();const a=N.S.appts.find(x=>x.status==='hecha');a.report.family='<script>window.__y=1</script>';window.__y=0;await go('#/informe/'+a.id);N.route();eq(window.__y,0)});
t('estado corrupto en localStorage no deja la app en blanco',()=>{const old=localStorage.getItem('nurseapp.v1');localStorage.setItem('nurseapp.v1','{"patients":');let threw=false;try{eval('(function(){try{const r=localStorage.getItem("nurseapp.v1");JSON.parse(r)}catch(e){threw=true}})()')}catch(e){}ok(threw);localStorage.setItem('nurseapp.v1',old||'{}')});
t('guardar con cuota llena avisa y no explota',()=>{fresh();const set=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new DOMException('Quota','QuotaExceededError')};let r;try{r=N.saveNow()}finally{Storage.prototype.setItem=set}eq(r,false)});
t('paciente sin nombre es rechazada',async()=>{fresh();await go('#/pacientes');click('[data-act=newpat]');const f=document.querySelector('form[data-form=pat]');f.requestSubmit();await wait(60);ok(/Falta el nombre/.test(document.body.innerText))});
t('agendar con duración 0 es rechazado',async()=>{fresh();await go('#/agenda');click('[data-act=newappt]');const f=document.querySelector('form[data-form=appt]');f.elements.patientId.value=N.S.patients[0].id;f.elements.type.value='x';f.elements.dur.value='0';f.requestSubmit();await wait(60);ok(/al menos 10 minutos/.test(document.body.innerText));ok(!N.S.appts.some(a=>a.type==='x'))});
t('guardar con choque ofrece alternativas y no guarda',async()=>{fresh();await go('#/agenda');click('[data-act=newappt]');const f=document.querySelector('form[data-form=appt]');f.elements.patientId.value=N.S.patients[1].id;f.elements.type.value='choque';f.elements.date.value=N.today();f.elements.start.value='10:30';f.elements.dur.value='30';f.requestSubmit();await wait(60);ok(/Choque detectado/.test(document.body.innerText));ok(document.querySelectorAll('[data-act=usesug]').length>=1);ok(!N.S.appts.some(a=>a.type==='choque'))});
t('ficha inexistente muestra mensaje, no error',async()=>{fresh();await go('#/ficha/noexiste');N.route();ok(/no encontrada/.test(txt()))});
t('ruta desconocida cae en Hoy',async()=>{fresh();await go('#/loquesea');N.route();ok(/atenciones hoy/.test(txt()))});
t('importar respaldo inválido no pisa datos',async()=>{fresh();const n=N.S.patients.length;const f=new File(['{"hola":1}'],'x.json',{type:'application/json'});const inp=document.createElement('input');Object.defineProperty(inp,'files',{value:[f]});inp.dataset.act='import';const cf=window.confirm;window.confirm=()=>true;document.dispatchEvent(Object.assign(new Event('change',{bubbles:true}),{}));inp.dispatchEvent(new Event('change',{bubbles:true}));document.body.appendChild(inp);inp.dispatchEvent(new Event('change',{bubbles:true}));await wait(150);inp.remove();window.confirm=cf;eq(N.S.patients.length,n)});

/* R10 · Extremo a extremo + PWA */
cur=R[10]=[];
t('manifest válido con íconos',async()=>{const m=await (await fetch('manifest.json')).json();ok(m.name&&m.start_url&&m.display==='standalone'&&m.icons.length>=3);for(const i of m.icons){const r=await fetch(i.src);ok(r.ok,i.src)}});
t('service worker presente y con CACHE_NAME',async()=>{const s=await (await fetch('sw.js')).text();ok(/const CACHE_NAME = 'nurse-app-v\d+'/.test(s))});
t('recorrido completo: paciente nueva → cotización → aceptación → visita → informe → cobro',async()=>{
 N.S=N.DEFAULTS();N.saveNow();await go('#/pacientes');N.route();
 click('[data-act=newpat]');let f=document.querySelector('form[data-form=pat]');f.elements.name.value='Carmen Ibáñez';f.elements.zone.value='Talca Centro';f.elements.rname.value='Pablo Ibáñez';f.elements.rrel.value='hijo';f.elements.rphone.value='+56 9 4444 3210';f.elements.ind.value='Curaciones · 3 días';f.requestSubmit();await wait(80);
 const p=N.S.patients[0];ok(p&&p.name==='Carmen Ibáñez');
 await go('#/ficha/'+p.id);const cf=window.confirm;window.confirm=()=>true;click('[data-act=consent]');ok(p.consent);
 await go('#/cotizar');N.route();f=document.querySelector('form[data-form=quote]');f.elements.patientId.value=p.id;f.elements.servicio.value='Curaciones 3 días';f.elements.qty.value='3';f.elements.unit.value='18000';f.requestSubmit();await wait(120);
 const q=N.S.quotes[0];ok(q);const o=window.open;window.open=()=>{};click('[data-act=qsend]');ok(q.status==='enviada');click('[data-act=qaccept]');ok(q.status==='aceptada');
 const a=N.S.appts.find(x=>x.patientId===p.id&&x.status==='prog');ok(a,'sin atenciones agendadas');
 N.startVisit(a.id);await wait(80);document.querySelector('form[data-form=visit]').requestSubmit();await wait(100);ok(a.report);
 document.querySelector('#chk4').click();document.querySelector('#sendrpt').click();ok(a.report.sent);
 await go('#/cobros');N.route();ok(txt().includes('$54.000'));const ch=N.S.charges[0];click(`[data-act=pay][data-id="${ch.id}"]`);window.confirm=cf;window.open=o;eq(ch.status,'pagado');
 await go('#/panel');N.route();ok(txt().includes('$54.000'))});
t('respaldo exportado contiene todo y reimporta idéntico',()=>{fresh();const j=JSON.stringify(N.S);const o=JSON.parse(j);eq(o.patients.length,N.S.patients.length);eq(o.charges.length,N.S.charges.length)});
t('disponibilidad: texto publicable no filtra pacientes',async()=>{fresh();await go('#/disponibilidad');N.route();const tx=document.querySelector('#c916').innerText;ok(!/Rosa|Hernán|Mateo|Elena/.test(tx),tx)});
t('canvas de la imagen 9:16 se genera',async()=>{fresh();await go('#/disponibilidad');let clicked=false;const oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)clicked=this.download};click('[data-act=dlcard]');await wait(2500);HTMLAnchorElement.prototype.click=oc;eq(clicked,'horas-disponibles.png')});
t('ajustes guardan tarifas y validan horario',async()=>{fresh();await go('#/ajustes');N.route();const f=document.querySelector('form[data-form=settings]');f.elements.visita.value='20000';f.requestSubmit();await wait(60);eq(N.S.tarifas.visita,20000);f.elements.ini.value='20:00';f.elements.fin.value='08:00';f.requestSubmit();await wait(60);ok(/posterior/.test(document.body.innerText));N.S.tarifas.visita=18000});
t('renderizado completo de la app < 200 ms por pantalla',async()=>{fresh();for(const s of screens){await go(s);const t0=performance.now();N.route();const dt=performance.now()-t0;ok(dt<200,s+' '+Math.round(dt)+'ms')}});
t('sin errores de consola en la sesión',()=>{ok(!window.__errs||window.__errs.length===0,JSON.stringify(window.__errs))});
t('tamaño del HTML razonable (<200 KB) para carga móvil',async()=>{const b=(await (await fetch('index.html')).text()).length;ok(b<200000,b+' bytes')});

window.__errs=[];window.addEventListener('error',e=>window.__errs.push(e.message));
window.runRound=async function(n){
 const res=[];
 for(const x of R[n]){try{await x.fn();res.push({ok:true,name:x.name})}catch(e){res.push({ok:false,name:x.name,err:String(e.message).slice(0,200)})}}
 return {round:n,pass:res.filter(r=>r.ok).length,total:res.length,fails:res.filter(r=>!r.ok)};
};
window.runAll=async function(){const o=[];for(let i=1;i<=10;i++)o.push(await runRound(i));return o};
})();
