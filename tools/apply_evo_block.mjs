// Aplica el bloque de evolución/resumen a index.html (idempotente). Uso: node tools/apply_evo_block.mjs
import fs from 'node:fs';
let s = fs.readFileSync('index.html', 'utf8');
const b = fs.readFileSync('tools/evo_block.js', 'utf8');
const mark = '/* ============ INFORME ============ */';
if (!s.includes(mark)) throw new Error('sin marca');
if (s.includes('EVOLUCIÓN Y RESUMEN')) { console.log('ya aplicado'); process.exit(0); }
const rep = (a, bb, name) => { if (!s.includes(a)) throw new Error('no encontré: ' + name); s = s.replace(a, () => bb); };
rep(mark, b + '\n' + mark, 'marca');
rep("const cardBox=(k,id)=>`", "const cardBox=(k,id,locked)=>`", 'cardBox firma');
rep('<button class="btn cta grow" data-act="cardshare" data-k="${k}" data-id="${id}">Compartir tarjeta</button>', '<button class="btn cta grow" data-act="cardshare" data-k="${k}" data-id="${id}" ${locked?\'disabled\':\'\'}>Compartir tarjeta</button>', 'cardBox boton');
rep("/#\\/(informe|cotizacion)\\/(\\w+)/", "/#\\/(informe|cotizacion|resumen)\\/(\\w+)/", 'regex hydrate');
rep("b=k==='informe'?await reportCard(A(id)):await quoteCard(Q(id))}catch(e){console.error(e);return}", "b=k==='informe'?await reportCard(A(id)):k==='resumen'?await summaryCard(P(id),S.ui.rdays||7):await quoteCard(Q(id))}catch(e){console.error(e);return}", 'hydrate b');
rep("try{b=k==='informe'?await reportCard(A(id)):await quoteCard(Q(id));CARDS[k+id]=b}", "try{b=k==='informe'?await reportCard(A(id)):k==='resumen'?await summaryCard(P(id),S.ui.rdays||7):await quoteCard(Q(id));CARDS[k+id]=b}", 'cardshare b');
rep("const nm=k==='informe'?'informe-'+slug(P(A(id).patientId).name.split(/[ ,]/)[0])+'-'+A(id).date+'.png':'cotizacion-'+Q(id).n+'.png';", "const nm=k==='informe'?'informe-'+slug(P(A(id).patientId).name.split(/[ ,]/)[0])+'-'+A(id).date+'.png':k==='resumen'?'resumen-'+slug(P(id).name.split(/[ ,]/)[0])+'-'+today()+'.png':'cotizacion-'+Q(id).n+'.png';", 'nombre');
rep("else await shareCard(b,nm,k==='informe'?'Así estuvo hoy':'Tu propuesta de cuidado');break}", "else await shareCard(b,nm,k==='informe'?'Así estuvo hoy':k==='resumen'?summaryText(P(id),S.ui.rdays||7):'Tu propuesta de cuidado');break}", 'texto share');
rep(" case 'imode':S.ui.imode=el.dataset.m;save();route();break;", " case 'imode':S.ui.imode=el.dataset.m;save();route();break;\n case 'rdays':S.ui.rdays=+el.dataset.d;save();route();break;", 'rdays');
rep(" ${mode==='fam'?cardBox('informe',a.id):''}\n", " ${mode==='fam'?cardBox('informe',a.id):''}\n ${evoBox(a.patientId,a.id)}\n ${vitSeries(a.patientId,null,2).length?`<a class=\"btn sec noprint\" href=\"#/resumen/${a.patientId}\">Ver resumen de la semana ›</a>`:''}\n", 'informe evo');
rep("`<p>${esc(rp.clinical)}</p>`}", "`<p>${esc(rp.clinical)}</p>${vitTable(a.patientId,a.id)}`}", 'tabla clinica');
rep("const vit=[['PRESIÓN',v.pa,'mmHg'],['PULSO',v.fc,'lpm'],['TEMP.',v.temp,'°C'],['SAT. O₂',v.sat,'%']].filter(t=>t[1]);", "const ser0=vitSeries(a.patientId,a.id,6);const dl=k=>{const d=vitDelta(ser0,k);return d===null?'':' · '+dShort(d)};const vit=[['PRESIÓN',v.pa,'mmHg'+dl('pas')],['PULSO',v.fc,'lpm'+dl('fc')],['TEMP.',v.temp,'°C'+dl('temp')],['SAT. O₂',v.sat,'%'+dl('sat')]].filter(t=>t[1]);", 'delta tarjeta');
rep('<a class="btn sec sm" href="#/portal/${p.id}">Portal familiar ›</a></div>', '<a class="btn sec sm" href="#/portal/${p.id}">Portal familiar ›</a></div>\n  ${vis.length?`<a class="btn sec" href="#/resumen/${p.id}">Resumen de la semana para la familia ›</a>`:\'\'}', 'ficha boton');
rep("window.NURSE={reportCard,quoteCard,", "window.NURSE={reportCard,quoteCard,summaryCard,summaryText,periodStats,vitSeries,vitOf,vitDelta,evoBox,", 'exports');
fs.writeFileSync('index.html', s);
console.log('aplicado');
