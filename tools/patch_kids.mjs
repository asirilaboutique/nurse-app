import fs from 'node:fs';
let s = fs.readFileSync('index.html', 'utf8');
const rep = (a, b, n) => { if (!s.includes(a)) throw new Error('no encontré: ' + n); s = s.replace(a, () => b); };

// 1) constantes y helpers de cuidado infantil
rep("const VIG=['Sin sangrado','Sin dolor','Hematoma en sitio','Otro'];",
`const VIG=['Sin sangrado','Sin dolor','Hematoma en sitio','Otro'];
/* ===== CUIDADO INFANTIL: informe de niños y actividades ===== */
const KID_ANIMO=['Contento','Tranquilo','Inquieto','Irritable','Decaído'];
const KID_COMIO=['Todo','Casi todo','Poco','Nada'];
const KID_COMIDAS=['Desayuno','Almuerzo','Once','Cena','Mamadera o leche','Colación'];
const KID_ACTS=['Juego libre','Cuentos y lectura','Dibujo y pintura','Música y canto','Juego al aire libre','Estimulación motora','Estimulación del lenguaje','Juego sensorial','Tareas escolares','Rutina de sueño'];
const KID_INC=['Sin incidentes','Golpe o caída leve','Rechazó comida','Rabieta','Fiebre','Vómito o diarrea'];
const isKid=(a,p)=>!!p&&!/inyecc|anticoag|curaci/i.test(a.type||'')&&(p.svc==='Niños'||p.svc==='Bebé y niño'||/niñ|bebé|infantil/i.test(a.type||''));
const chk=(n,list,sel)=>list.map(v=>\`<label class="chip row" style="display:inline-flex;align-items:center;gap:6px"><input type="checkbox" name="\${n}" value="\${v}" style="width:auto;min-height:0" \${(sel||[]).includes(v)?'checked':''}>\${v}</label>\`).join('');
const rad=(n,list,sel)=>list.map(v=>\`<label class="chip row" style="display:inline-flex;align-items:center;gap:6px"><input type="radio" name="\${n}" value="\${v}" style="width:auto;min-height:0" \${sel===v?'checked':''}>\${v}</label>\`).join('');
function kidCard(r){const k=r.kid||{};
 return \`<input type="hidden" name="kidmode" value="1">
 <div class="card col"><b>Cómo estuvo hoy</b><div class="f"><span>Ánimo</span><div class="row" style="flex-wrap:wrap;margin-top:4px">\${rad('animo',KID_ANIMO,k.animo)}</div></div>
 <div class="f"><span>Cuánto comió</span><div class="row" style="flex-wrap:wrap;margin-top:4px">\${rad('comio',KID_COMIO,k.comio)}</div></div>
 <div class="f"><span>Comidas del turno</span><div class="row" style="flex-wrap:wrap;margin-top:4px">\${chk('comidas',KID_COMIDAS,k.comidas)}</div></div></div>
 <div class="card col"><b>Sueño e higiene</b><div class="row"><label class="f grow">Siesta (min)<input name="siesta" inputmode="numeric" value="\${esc(k.siesta||'')}" placeholder="90"></label><label class="f grow">Cambios de pañal<input name="panales" inputmode="numeric" value="\${esc(k.panales||'')}" placeholder="3"></label></div>
 <label class="chip row" style="display:inline-flex;align-items:center;gap:6px"><input type="checkbox" name="bano" value="1" style="width:auto;min-height:0" \${k.bano?'checked':''}>Se bañó</label></div>
 <div class="card col"><b>Actividades con él o ella</b><div class="row" style="flex-wrap:wrap;margin-top:4px">\${chk('acts',KID_ACTS,k.acts)}</div>
 <label class="f">Lo más lindo o un logro de hoy<input name="logro" maxlength="140" value="\${esc(k.logro||'')}" placeholder="Armó una torre de 6 bloques"></label></div>
 <div class="card col"><b>Salud e incidentes</b><div class="row" style="flex-wrap:wrap;margin-top:4px">\${chk('inc',KID_INC,k.inc)}</div>
 <label class="f">Medicamento administrado (solo con indicación)<input name="med" value="\${esc(k.med||'')}" placeholder="Nombre, dosis y hora"></label></div>\`}
function kidFamily(a,p,r){const k=r.kid||{};const f=p.name.split(/[ ,]/)[0];const b=[];
 b.push(\`Hoy cuidé a \${f}.\`);
 if(k.animo)b.push(\`Estuvo \${k.animo.toLowerCase()}.\`);
 if(k.comio)b.push(\`Comió \${k.comio.toLowerCase()}\${(k.comidas||[]).length?' ('+k.comidas.map(x=>x.toLowerCase()).join(', ')+')':''}.\`);
 if(k.siesta)b.push(\`Durmió una siesta de \${k.siesta} minutos.\`);
 if(k.panales)b.push(\`Hice \${k.panales} cambio\${+k.panales===1?'':'s'} de pañal\${k.bano?' y se bañó':''}.\`);else if(k.bano)b.push('Se bañó.');
 if((k.acts||[]).length)b.push('Hicimos: '+k.acts.map(x=>x.toLowerCase()).join(', ')+'.');
 if(k.logro)b.push('Lo más lindo: '+k.logro.trim().replace(/[.!]+$/,'')+'.');
 const inc=(k.inc||[]).filter(x=>x!=='Sin incidentes');
 b.push(inc.length?'Para tener en cuenta: '+inc.map(x=>x.toLowerCase()).join(', ')+'.':'No hubo incidentes.');
 if(k.med)b.push('Se administró '+k.med.trim()+', según la indicación.');
 const v=r.vit||{};if(v.temp)b.push(\`Su temperatura fue \${v.temp} °C.\`);
 if(r.nota)b.push(r.nota.trim().replace(/\\s+/g,' ').replace(/^./,c=>c.toUpperCase()).replace(/([^.!?])$/,'$1.'));
 const nxt=S.appts.filter(x=>x.patientId===a.patientId&&x.status==='prog'&&(x.date+x.start)>(a.date+a.start)).sort((x,y)=>(x.date+x.start).localeCompare(y.date+y.start))[0];
 const obs=\`Fíjate esta tarde en su apetito, su ánimo y cómo duerme esta noche\${inc.some(x=>/Fiebre|Vómito/.test(x))?'; si la fiebre sigue o hay decaimiento, consulta a su pediatra':''}. Avísame si algo te preocupa.\${nxt?' Nos vemos '+fdate(nxt.date,true).toLowerCase()+' a las '+nxt.start+'.':''}\`;
 return {texto:b.join(' '),obs}}
function kidClinical(a,p,r){const k=r.kid||{};const v=r.vit||{};
 return \`\${fdate(a.date,true)} \${a.start}. \${a.type}. Ánimo: \${k.animo||'—'}. Ingesta: \${k.comio||'—'}\${(k.comidas||[]).length?' ('+k.comidas.join(', ')+')':''}. Siesta: \${k.siesta?k.siesta+' min':'—'}. Pañales: \${k.panales||'—'}\${k.bano?' · baño':''}. Actividades: \${(k.acts||[]).join(', ')||'—'}. \${k.logro?'Logro: '+k.logro+'. ':''}Incidentes: \${(k.inc||[]).join(', ')||'sin registro'}. \${k.med?'Medicamento: '+k.med+'. ':''}T° \${v.temp||'—'}. \${r.nota||''}\`.trim()}`, 'constantes kid');

// 2) formulario de visita
rep("const isInj=/inyecc|anticoag/i.test(a.type);\n const last=", "const isInj=/inyecc|anticoag/i.test(a.type);const kid=isKid(a,p);\n const last=", 'kid flag visita');
rep(" ${isInj?`<div class=\"card col\"><b>Registro de inyección</b>", " ${kid?kidCard(r):''}\n ${isInj&&!kid?`<div class=\"card col\"><b>Registro de inyección</b>", 'kid card');
rep(" <div class=\"card\"><b>Vigilancia</b> <span class=\"xs mut\">criterios que tú definiste</span>", " ${kid?'':`<div class=\"card\"><b>Vigilancia</b> <span class=\"xs mut\">criterios que tú definiste</span>", 'vig inicio');
rep("${v}</label>`).join('')}</div></div>\n <label class=\"f\">Nota para el informe", "${v}</label>`).join('')}</div></div>`}\n <label class=\"f\">Nota para el informe", 'vig fin');
rep("<div class=\"card col\"><b>Signos vitales</b><div class=\"row\">", "<div class=\"card col\"><b>Signos vitales</b>${kid?' <span class=\"xs mut\">opcional</span>':''}<div class=\"row\">", 'sv opcional');

// 3) generadores
rep("function genFamily(a,p,r){\n", "function genFamily(a,p,r){\n if(r.kid)return kidFamily(a,p,r);\n", 'genFamily');
rep("function genClinical(a,p,r){\n", "function genClinical(a,p,r){\n if(r.kid)return kidClinical(a,p,r);\n", 'genClinical');

// 4) cierre de visita
rep("r.vig=fd.getAll('vig');r.nota=fd.get('nota')||'';r.end=new Date().toISOString();",
"r.vig=fd.getAll('vig');r.nota=fd.get('nota')||'';r.end=new Date().toISOString();\n if(fd.get('kidmode')){r.kid={animo:fd.get('animo')||'',comio:fd.get('comio')||'',comidas:fd.getAll('comidas'),siesta:(fd.get('siesta')||'').trim(),panales:(fd.get('panales')||'').trim(),bano:!!fd.get('bano'),acts:fd.getAll('acts'),logro:(fd.get('logro')||'').trim(),inc:fd.getAll('inc'),med:(fd.get('med')||'').trim()};r.vig=r.kid.inc.slice();r.farmaco='';r.dosis='';r.sitio=''}", 'closeVisit');

// 5) tarjeta para compartir: fichas y actividades
rep("const vit=[['PRESIÓN',v.pa,'mmHg'+dl('pas')],['PULSO',v.fc,'lpm'+dl('fc')],['TEMP.',v.temp,'°C'+dl('temp')],['SAT. O₂',v.sat,'%'+dl('sat')]].filter(t=>t[1]);",
"const kk=r.kid;const vit=(kk?[['ÁNIMO',kk.animo,'hoy'],['COMIÓ',kk.comio,'en el turno'],['SIESTA',kk.siesta,'min'],['TEMP.',v.temp,'°C']]:[['PRESIÓN',v.pa,'mmHg'+dl('pas')],['PULSO',v.fc,'lpm'+dl('fc')],['TEMP.',v.temp,'°C'+dl('temp')],['SAT. O₂',v.sat,'%'+dl('sat')]]).filter(t=>t[1]);", 'tarjeta tiles');
rep("let thumbs=[];try{for(const m of (a.media||[])", "if(kk&&(kk.acts||[]).length){let cx=70;x.font='600 26px \"DM Sans\", sans-serif';T(x,'ACTIVIDADES DE HOY',70,y+14,'700 19px \"DM Sans\", sans-serif',TQ,'left',3);y+=34;kk.acts.slice(0,6).forEach(s=>{const w=x.measureText(s).width+40;if(cx+w>1010){cx=70;y+=62}rr(x,cx,y,w,50,25);x.fillStyle=CLO;x.fill();T(x,s,cx+20,y+34,'600 26px \"DM Sans\", sans-serif',NV);cx+=w+12});y+=50+30}\n let thumbs=[];try{for(const m of (a.media||[])", 'tarjeta actividades');

// 6) resumen semanal: texto adecuado para niños
rep("+'Registré sus signos vitales en cada visita. Ante cualquier cambio, escríbeme; en una emergencia llama al 131.'}",
"+(st.vis.some(a=>a.record&&a.record.kid)?'Registré su ánimo, alimentación, sueño y actividades en cada visita. Ante cualquier cambio, escríbeme; en una emergencia llama al 131.':'Registré sus signos vitales en cada visita. Ante cualquier cambio, escríbeme; en una emergencia llama al 131.')}", 'resumen texto');

// 7) servicio Niños en la ficha
rep("['Adulto mayor','Bebé y niño','Paliativo','Procedimientos']", "['Adulto mayor','Bebé y niño','Niños','Paliativo','Procedimientos']", 'servicio niños');

fs.writeFileSync('index.html', s); console.log('ok');
